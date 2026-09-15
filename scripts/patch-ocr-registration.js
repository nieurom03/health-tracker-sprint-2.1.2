const fs = require("node:fs");
const path = require("node:path");

const packagePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@dariyd",
  "react-native-text-recognition",
  "package.json",
);

if (!fs.existsSync(packagePath)) {
  throw new Error("OCR package is missing; run npm install before native setup.");
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
packageJson.codegenConfig ??= {};
packageJson.codegenConfig.ios ??= {};
packageJson.codegenConfig.ios.modulesProvider = {
  ...packageJson.codegenConfig.ios.modulesProvider,
  ReactNativeTextRecognition: "ReactNativeTextRecognition",
};

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log("Registered ReactNativeTextRecognition for iOS New Architecture codegen.");
