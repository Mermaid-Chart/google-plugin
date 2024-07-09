## 🚜 Install <a name = "install"></a>

These instructions will get you set up with a copy of the React project code on your local machine. It will also get you logged in to `clasp`, which lets you manage script projects from the command line.

See [deploy](#deploy) for notes on how to deploy the project and see it live in a Google Docs.

### Prerequisites <a name = "prerequisites"></a>

- Make sure you're running at least [Node.js](https://nodejs.org/en/download/) v18 and [yarn (classic)](https://classic.yarnpkg.com/lang/en/docs/install/).

- You'll need to enable the Google Apps Script API. You can do that by visiting [script.google.com/home/usersettings](https://script.google.com/home/usersettings).

- To use live reload while developing, you'll need to serve your files locally using HTTPS. See [local development](#local-development) below for instructions on setting up your local environment.

### 🏁 Getting started <a name = "getting-started"></a>

**1.** First, let's clone the repo and install the dependencies. This project is published as a public template, so you can also fork the repo or select "Use this template" in GitHub.

```bash
git clone https://github.com/Mermaid-Chart/google-plugin.git
cd google-plugin
yarn install
```

**2.** Next, we'll need to log in to [clasp](https://github.com/google/clasp), which lets us manage our Google Apps Script projects locally.

```bash
yarn run login
```

**3.** Now let's run the setup script to create a New document and script project from the command line.

```bash
yarn run setup
```

Alternatively, you can use an existing Google document and Script file instead of creating a new one.

<details>
  <summary>See instructions here for using an existing project.</summary>

You will need to update the `.clasp.json` file in the root of this project with the following three key/value pairs (see .clasp.json.SAMPLE for reference):

```json
{
  "scriptId": "1PY037hPcy................................................",
  "parentId": ["1Df30......................................."],
  "rootDir": "./dist"
}
```

- `scriptId`: Your existing script project's `scriptId`. You can find it by opening your document, selecting **Tools > Script Editor** from the menubar, then **File > Project properties**, and it will be listed as "Script ID".

- `parentId`: An array with a single string, the ID of the parent file (document, doc, etc.) that the script project is bound to. You can get this ID from the url, where the format is usually `https://docs.google.com/documents/d/{id}/edit`. This allows you to run `npm run open` and open your file directly from the command line.

- `rootDir`: This should always be `"./dist"`, i.e. the local build folder that is used to store project files.

</details>

<br/>

## 🚀 Deploy <a name = "deploy"></a>

Run the deploy command. You may be prompted to update your manifest file. Type 'yes'.

```bash
yarn run deploy
```

The deploy command will build all necessary files using production settings, including all server code (Google Apps Script code), client code (React bundle), and config files. All bundled files will be outputted to the `dist/` folder, then pushed to the Google Apps Script project.

Now open Google Docs and navigate to your new document (e.g. the file "My React Project"). You can also run `yarn run open`. Make sure to refresh the page if you already had it open. You will now see a new menu item appear containing your app!

<br/>

## 🎈 Local Development <a name="local-development"></a>

We can develop our client-side React apps locally, and see our changes directly inside our Google document dialog window.

There are two steps to getting started: installing a certificate (first time only), and running the start command.

1. Generating a certificate for local development <a name = "generatingcerts"></a>

   Install the mkcert package:

   ```bash
   # mac:
   brew install mkcert

   # windows:
   choco install mkcert
   ```

   [More install options here.](https://github.com/FiloSottile/mkcert#installation)

   Then run the mkcert install script:

   ```bash
   mkcert -install
   ```

   Create the certs in your repo:

   ```
   yarn run setup:https
   ```

2. Now you're ready to start:
   ```bash
   yarn run start
   ```

The start command will create and deploy a development build, and serve your local files.

After running the start command, navigate to your document and open one of the menu items. It should now be serving your local files. When you make and save changes to your React app, your app will reload instantly within the Google Docs, and have access to any server-side functions!

<br/>

### Typescript

This project is built mainly with typescript but also supports Javascript, and examples of both are included here, both in server-side and client-side (React) code. The included sample app has a typescript example using the Bootstrap component library.

To use typescript, simply use a typescript extension in either the client code (.ts/.tsx) or the server code (.ts), and your typescript file will compile to the proper format.

To use typescript in server code, just change the file extension to .ts. The server-side code already utilizes type definitions for Google Apps Script APIs.

A basic typescript configuration is used here that correctly transpiles to code that is compatible with Google Apps Script. However, if you want more control over your setup you can modify the included [tsconfig.json file](./tsconfig.json).

### Adding packages

You can add packages to your client-side React app.

For instance, install `react-transition-group`:

```bash
yarn add react-transition-group
```

Important: Since Google Apps Scripts projects don't let you easily reference external files, this project will bundle an entire app into one HTML file. If you are importing large libraries this can result in a large file. To help reduce the size of these large HTML files, you can try to externalize packages by using a CDN to load packages. For packages that can be loaded through a CDN (usually they will have a UMD build), you can configure the externals and globals details in the [vite config file](./vite.config.ts). You will also need to include a script element in the head of the `index.html` file, loading the library from a CDN, and making sure it supports a UMD build, e.g.
`<script crossorigin src="https://unpkg.com/react-transition-group@4.4.2/dist/react-transition-group.min.js"></script>`.

If set up properly, this will load packages from the CDN in production and will reduce your overall bundle size.

Make sure that you update the script tag with the same version of the package you are installing with yarn, so that you are using the same version in development and production.

### Styles

By default this project supports global CSS stylesheets. Make sure to import your stylesheet in your entrypoint file [index.js](./src/client/dialog-demo/index.js):

```javascript
import './styles.css';
```

Many external component libraries require a css stylesheet in order to work properly. You can import stylesheets in the HTML template, [as shown here with the Bootstrap stylesheet](./src/client/dialog-demo-bootstrap/index.html).

### Modifying scopes

The included app only requires access to Google documents and to loading dialog windows. If you make changes to the app's requirements, for instance, if you modify this project to work with Google Forms or Docs, make sure to edit the oauthScopes in the [appscript.json file](./appsscript.json).

See https://developers.google.com/apps-script/manifest for information on the `appsscript.json` structure.

### Calling server-side Google Apps Script functions

This project uses the [gas-client](https://github.com/enuchi/gas-client) package to more easily call server-side functions using promises.

```js
// Google's client-side google.script.run utility requires calling server-side functions like this:
google.script.run
  .withSuccessHandler((response) => doSomething(response))
  .withFailureHandler((err) => handleError(err))
  .addSheet(sheetTitle);

// Using gas-client we can use more familiar promises style like this:
import Server from 'gas-client';
const { serverFunctions } = new Server();

// We now have access to all our server functions, which return promises!
serverFunctions
  .addSheet(sheetTitle)
  .then((response) => doSomething(response))
  .catch((err) => handleError(err));

// Or with async/await:
async () => {
  try {
    const response = await serverFunctions.addSheet(sheetTitle);
    doSomething(response);
  } catch (err) {
    handleError(err);
  }
};
```

In development, `gas-client` will allow you to call server-side functions from your local environment. In production, it will use Google's underlying `google.script.run` utility.
