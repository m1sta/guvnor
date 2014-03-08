var commander = require("commander"),
	pkg = require(__dirname + "/../package.json"),
	path = require("path"),
	Autowire = require("wantsit").Autowire;

var CLI = function() {
	this._boss = Autowire;
};

CLI.prototype.afterPropertiesSet = function() {

	commander
		.version(pkg.version);

	commander
		.command("list")
		.description("List all running processes")
		.action(this.list.bind(this));

	commander
		.command("start <script>")
		.description("Start a process")
		.option("-u, --user", "The user to start a process as")
		.option("-g, --group", "The group to start a process as")
		.action(this.start.bind(this));

	commander
		.command("stop [name]")
		.description("Stop a process")
		.action(this.stop.bind(this));

	commander
		.command("kill")
		.description("Stop all processes and kill the daemon")
		.action(this.kill.bind(this));

	commander
		.command("key")
		.description("Manage client RSA keys")
		.action(this.key.bind(this))
			.command("add")
				.option("-n, --name", "A key name")
				.option("-k, --key", "The path to the key")
				.description("Add a key")
				.action(this.key.bind(this))
			.command("rm")
				.option("-n, --name", "A key name")
				.description("Remove a key")
				.action(this.key.bind(this))
			.command("list")
				.description("List the keys")
				.action(this.key.bind(this));

	commander
		.command("*")
		.action(this.default.bind(this));

	commander.parse(process.argv);
}

CLI.prototype.list = function() {
	this._boss.invoke(function() {
		this._boss.listProcesses(function(error, processes) {
			console.info(processes);
		});
	}.bind(this));
};

CLI.prototype.start = function(script, options) {
	script = path.resolve(script);

	this._boss.invoke(function() {
		this._boss.startProcess(script, function(error) {
			if(error) {
				console.error(error);
			}

			console.info(script, "started");
		});
	}.bind(this));
};

CLI.prototype.stop = function() {

};

CLI.prototype.kill = function() {
	this._boss.invoke(function() {
		this._boss.kill();

		process.exit(0);
	}.bind(this));
};

CLI.prototype.key = function() {

};

CLI.prototype.default = function() {
	console.info("Please specify a subcommand");
	process.exit(0);
};

module.exports = CLI;