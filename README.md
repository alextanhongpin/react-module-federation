# react-module-federation

## Step 1 - Create Applications

Create two applications

```bash
$ npx create-react-app home-app
$ npx create-react-app header-app
```

## Step 2 - Install Webpack 5


Within each application, install webpack 5 and related dependencies.

```bash
#Yarn
yarn add -D webpack webpack-cli html-webpack-plugin webpack-dev-server babel-loader css-loader
```

## Step 3 - Customize Home Page

In `home-app/App.js`:

```js
import React from 'react'; // Must be imported for webpack to work
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="container">This is my home page</div>
    </div>
  );
}

export default App;
```


Run your home app:

```
cd ./home-app && yarn && yarn start
```

## Step 4 — Customize Header Page

```js
import React from 'react'; // Must be imported for webpack to work
import './App.css';

function App() {
  return (
    <div className="HeaderApp">
      <div>Header</div>
    </div>
  );
}

export default App;
```

Run your header app:

```bash
$ cd ./home-app && yarn && yarn start
```

## Step 5 — Webpack Configuration

Create `webpack.config.js` file at the root of `header-app/` and `home-app/`:


```js
//home-app/webpack.config.js
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/index",
    mode: "development",
    devServer: {
        port: 3000,  // port 3001 for header-app
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /node_modules/,
                use: [
                    {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        }),
    ],
    resolve: {
        extensions: [".js", ".jsx"],
    },
    target: "web",
};
```


Modify header-app/src/index.js & home-app/src/index.js:


```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Modify header-app/public/index.html & home-app/public/index.html:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React with Webpack</title>
  </head>
  <body>
    <div id="app"></div>

    <script src="main.js"></script>
  </body>
</html>
```

Change the start script in header-app/package.json & home-app/package.json to utilize our webpack config:

```json
"scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production",
 },
```

Run your header-app and home-app:

```
cd home-app && yarn start
cd header-app && yarn start
```

## Step 5 — Module Federation Configuration


First, we need add a file entry.js as an entry to each of our app.

We need this additional layer of indirection because it allows Webpack to load all necessary imports for rendering the remote app.

Create header-app/entry.js and home-app/entry.js:

```js
import('./index.js')
```

Modify the entry of header-app/webpack.config.js and home-app/webpack.config.js

```js
module.exports = {
    entry: "./src/entry.js",
    //...
}
```

## Step 6— Exposes Header for Module Federation

Now we need to expose Header for home-app to use, in our header-app/webpack.config.js:

```js
// header-app/webpack.config.js
const HtmlWebpackPlugin = require("html-webpack-plugin");
// import ModuleFederationPlugin from webpack
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
// import dependencies from package.json, which includes react and react-dom
const { dependencies } = require("./package.json");
```

```js
module.exports = {
    //...
    plugins: [
        //...
        new ModuleFederationPlugin({
            name: "HeaderApp",  // This application named 'HeaderApp'
            filename: "remoteEntry.js",  // output a js file
            exposes: { // which exposes
              "./Header": "./src/App",  // a module 'Header' from './src/App'
            },
            shared: {  // and shared
              ...dependencies,  // some other dependencies
              react: { // react
                singleton: true,
                requiredVersion: dependencies["react"],
              },
              "react-dom": { // react-dom
                singleton: true,
                requiredVersion: dependencies["react-dom"],
              },
            },
        }),
    ],
};

```
Start the app, navigate to http://localhost:3001/remoteEntry.js. This is a manifest of all of the modules that are exposed by the header application.

## Step 7 — Add Module Federation in Home App
Now we need to add the ModuleFederationPlugin to home-app/webpack.config.js:

```js
// home-app/webpack.config.js
const HtmlWebpackPlugin = require("html-webpack-plugin");
// import ModuleFederationPlugin from webpack
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
// import dependencies from package.json, which includes react and react-dom
const { dependencies } = require("./package.json");
```

```js
module.exports = {
    //...
    plugins: [
        //...
        new ModuleFederationPlugin({
            name: "HomeApp",  // This application named 'HomeApp'
            // This is where we define the federated modules that we want to consume in this app.
            // Note that we specify "Header" as the internal name
            // so that we can load the components using import("Header/").
            // We also define the location where the remote's module definition is hosted:
            // Header@[http://localhost:3001/remoteEntry.js].
            // This URL provides three important pieces of information: the module's name is "Header", it is hosted on "localhost:3001",
            // and its module definition is "remoteEntry.js".
            remotes: {
                "HeaderApp": "HeaderApp@http://localhost:3001/remoteEntry.js",
            },
            shared: {  // and shared
                ...dependencies,  // other dependencies
                react: { // react
                    singleton: true,
                    requiredVersion: dependencies["react"],
                },
                "react-dom": { // react-dom
                    singleton: true,
                    requiredVersion: dependencies["react-dom"],
                },
            },
        }),
    ],
};

```

Modify home-app/src/App.js to use the Header component from the remote app:

```js
import React, { lazy, Suspense } from 'react'; // Must be imported for webpack to work
import './App.css';

const Header = lazy(() => import('HeaderApp/Header'));

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div>Loading Header...</div>}>
        <Header />
      </Suspense>
      <div className="container">Demo home page</div>
    </div>
  );
}

export default App;
```
Run your home-app and header-app:

```
cd home-app && yarn start
cd header-app && yarn start
```
