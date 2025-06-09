const prompts = require('prompts');
const path = require('path');
const fs = require('fs');
const request = require('superagent');
const kleur = require('kleur');
const { execSync } = require('child_process');
const sizeOf = require('image-size');
const generateFallbackData = require('./fallbackTemplate');
const generateCapiData = require('../src/capi');

let config;

try {
  config = require('../config.json');
} catch (error) {
  console.log(kleur.italic().yellow(`Looks like you're missing your config.json`));
  console.log(kleur.red(`Exiting deployment.`));
  process.exit(1);
}

async function run() {
  if (!config.uuid) {
    console.log(kleur.red('Please set a uuid in config.json'));
    console.log(kleur.red(`Exiting deployment.`));
    process.exit(1);
  }

  if (!config.slug) {
    console.log(kleur.red('Please set a slug in config.json'));
    console.log(kleur.red(`Exiting deployment.`));
    process.exit(1);
  }

  const response = await prompts([
    {
      type: 'select',
      name: 'env',
      message: 'Select an environment',
      choices: [
        { title: 'Development', value: 'development' },
        { title: 'Production', value: 'production' },
      ],
      initial: 0,
    },
    {
      type: prev => (prev === 'production' ? 'confirm' : null),
      name: 'prodConfirm',
      message: 'Please confirm that you want to deploy to Production?',
    },
    {
      type: 'confirm',
      name: 'projectNameConfirm',
      message: `Is this the correct project name: ${config.slug}?`,
    },
  ]);

  if (response.prodConfirm === false || response.projectNameConfirm === false) return;
  const { env } = response;
  const destination =
    env === 'development'
      ? `${config.slug}-${config.uuid}-dev`
      : `${config.slug}-${config.uuid}`;

  build(env);
  await attachFallbackImage(destination);
  await attachCapi(destination);
  await upload(destination);
}

function build(env) {
  console.log(kleur.blue(`Building your inset ...`));
  const command = config.ssg ? `babel-node lib/ssg.js` : `NODE_ENV=${env} webpack`;
  execSync(command, { stdio: 'inherit' });
}

async function attachFallbackImage(destination) {
  if (!config.fallbackImage) return;

  const url = config.fallbackImage;
  const image = await request.get(url).responseType('arraybuffer');
  const dimensions = sizeOf(image.body);
  const file = path.resolve(__dirname, '../dist/inset.json');
  const inset = JSON.parse(fs.readFileSync(file, 'utf8'));
  inset.alt = generateFallbackData(url, dimensions, destination);

  fs.writeFileSync(file, JSON.stringify(inset));
  console.log(kleur.green('Fallback image added to inset.json'));
}

async function attachCapi() {
  if (!config.capi) return;

  const capi = await generateCapiData();
  const file = path.resolve(__dirname, '../dist/inset.json');
  const inset = JSON.parse(fs.readFileSync(file, 'utf8'));
  inset.alt = { ...inset.alt, capi };

  fs.writeFileSync(file, JSON.stringify(inset));
  console.log(kleur.green('CAPI has been added to inset.json'));
}

async function upload(destination) {
  console.log(kleur.blue(`Uploading your inset to Multi-Region Assets API...`));

  const dist = path.resolve(__dirname, '../dist');

  try {
    const files = fs
      .readdirSync(dist, { withFileTypes: true })
      .filter(file => !file.isDirectory())
      .map(file => file.name);

    const target = 'barrons';
    const subfolder = 'graphics-projects';

    const promises = files.map(async file => {
      const filepath = path.join(dist, file);

      const isJson = file.endsWith('.json');
      const contentType = isJson
        ? 'application/json'
        : file.endsWith('.html')
        ? 'text/html'
        : 'application/octet-stream';

      try {
        console.log(kleur.yellow(`Uploading: ${file}`));

        const fileContent = fs.readFileSync(filepath, 'utf8');

        const apiToken =
          process.env.MRA_API_TOKEN ||
          fs
            .readFileSync(path.resolve(__dirname, '../.npmrc'), 'utf-8')
            .match(/^MRA_API_TOKEN=(.*)$/m)?.[1]
            ?.trim();

        const response = await request
          .put(
            `https://multi-region-assets.onservo.com/api/v1/file/${target}/${subfolder}/${destination}/${file}`,
          )
          .set('api_token', apiToken)
          .set('Content-Type', contentType)
          .set('Content-Disposition', 'inline')
          .set('Cache-Control', 'public, max-age=120')
          .set('Vary', 'Accept-Encoding')
          .send(fileContent);

        console.log(kleur.green(`Uploaded: ${file} - Status: ${response.status}`));
        return response;
      } catch (error) {
        console.log(kleur.red(`Error uploading ${file}:`), error.message);
        return null;
      }
    });

    const responses = await Promise.all(promises);
    const validResponses = responses.filter(res => res !== null);

    if (!validResponses.length || !validResponses.every(response => response.ok)) {
      console.log(kleur.red('There was an error uploading your inset.'));
      console.log(kleur.red(`Exiting deployment.`));
      process.exit(1);
    }

    const s3BaseUrl = 'https://www.barrons.com/asset/barrons';

    const insetUrl = `${s3BaseUrl}/${subfolder}/${destination}/inset.json`;
    const iframeUrl = `${s3BaseUrl}/${subfolder}/${destination}/iframe.html`;
    const previewUrl = `https://wsj-newsroom-tools.sc.onservo.com/dynamic-inset-previewer?url=${insetUrl}&layout=inline&template=immersive`;
    const capiUrl = config.capi
      ? `https://wsj-newsroom-tools.sc.onservo.com/capi-simulator?url=${insetUrl}`
      : null;

    const output = [
      ['Inset URL', insetUrl],
      ['Preview', previewUrl],
      ['Iframe', iframeUrl],
      config.capi && ['CAPI Simulator', capiUrl],
    ].filter(i => i);

    console.log();
    console.log(kleur.green(`Your inset has been deployed.`));
    console.log('-----\n');
    output.forEach(element => {
      console.log(kleur.cyan(element.join('\n')), '\n');
    });
    console.log('-----');
  } catch (error) {
    console.log(kleur.red('Error uploading to Multi-Region Assets API:'), error);
  }
}

run();
