var fs       = require('fs'),
  path     = require('path'),
  program  = require('commander');

var Deployer = require(__dirname +'/../deploy/deployer').Deployer;

var deployer_package_file = fs.readFileSync(__dirname +'/../package.json', 'utf8');
var deployer_package_json = JSON.parse(deployer_package_file);

program
  .option('-H, --host', 'Host to deploy to')
  .option('-U, --user', 'User to deploy with')
  .option('-R, --repo', 'Repository to deploy from')
  .version(deployer_package_json.version)
  .parse(process.argv);

var deployer = new Deployer(process.cwd(), program);

deployer.deploy();