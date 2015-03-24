var expect = require('chai').expect,
  sinon = require('sinon'),
  DaemonConnection = require('../../../lib/common/DaemonConnection'),
  EventEmitter = require('events').EventEmitter

describe('DaemonConnection', function () {
  var connection

  beforeEach(function() {
    connection = new DaemonConnection()
    connection.logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    connection._managedProcessFactory = {
      create: sinon.stub()
    }
    connection._semver = {

    }
  })

  it('should bork on missing process info', function (done) {
    connection._findManagedProcess(undefined, function (error, found) {
      expect(error).to.be.ok
      expect(error.message).to.contain('No process info')
      expect(found).to.not.exist

      done()
    })
  })

  it('should find a managed process', function (done) {
    var id = 'foo'
    var proc = {
      id: id,
      update: sinon.stub()
    }
    var info = {
      id: id
    }
    connection._processes[id] = proc

    connection._findManagedProcess(info, function (error, found) {
      expect(found).to.equal(proc)
      expect(proc.update.called).to.be.true

      done()
    })
  })

  it('should create a managed process when none is found', function (done) {
    var id = 'foo'
    var proc = {
      id: id,
      update: sinon.stub()
    }
    var info = {
      id: id,
      socket: 'bar'
    }

    connection._managedProcessFactory.create.withArgs([info.socket], sinon.match.func).callsArgWith(1, undefined, proc)

    connection._findManagedProcess(info, function (error, found) {
      expect(found).to.equal(proc)

      done()
    })
  })

  it('should propagate error when creating managed process', function (done) {
    var id = 'foo'
    var proc = {
      id: id,
      update: sinon.stub()
    }
    var info = {
      id: id,
      socket: 'bar'
    }

    var error = new Error('Urk!')

    connection._managedProcessFactory.create.withArgs([info.socket], sinon.match.func).callsArgWith(1, error)

    connection._findManagedProcess(info, function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should add worker process to manager when creating managed process', function (done) {
    var id = 'foo'
    var info = {
      id: id
    }
    var manager = {
      id: 'bar',
      addWorker: sinon.stub()
    }
    var worker = {
      id: id,
      update: sinon.stub(),
      manager: manager.id
    }

    connection._processes[worker.id] = worker
    connection._processes[manager.id] = manager

    connection._findManagedProcess(info, function (error, found) {
      expect(found).to.equal(worker)
      expect(manager.addWorker.calledWith(worker)).to.be.true

      done()
    })
  })

  it('should remove missing processes', function () {
    var proc0 = {
      id: 'foo'
    }
    var proc1 = {
      id: 'bar'
    }

    connection._processes[proc0.id] = proc0
    connection._processes[proc1.id] = proc1

    connection._removeMissingProcesses([proc0])

    expect(connection._processes).to.not.contain(proc1)
  })

  it('should override listProcesses method and replace processInfo objects with manageProcess objects', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var processes = [{
      id: 'foo'
    }]

    var managedProcess = {
      id: processes[0].id,
      update: sinon.stub()
    }

    connection._processes[managedProcess.id] = managedProcess

    connection.listProcesses.callsArgWithAsync(0, undefined, processes)

    connection._overrideProcessInfoMethods()

    connection.listProcesses(function (error, processes) {
      expect(error).to.not.exist
      expect(processes[0]).to.equal(managedProcess)

      done()
    })
  })

  it('should override listProcesses method and propagate error', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var error = new Error('Urk!')

    connection.listProcesses.callsArgWithAsync(0, error)

    connection._overrideProcessInfoMethods()

    connection.listProcesses(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should override listProcesses method and propagate error when creating managed process object', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var processes = [{
      id: 'foo'
    }]

    var error = new Error('Urk!')

    connection.listProcesses.callsArgWithAsync(0, undefined, processes)
    connection._managedProcessFactory.create.callsArgWithAsync(1, error)

    connection._overrideProcessInfoMethods()

    connection.listProcesses(function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should override startProcess method and replace processInfo objects with manageProcess objects', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var processInfo = {
      id: 'foo'
    }

    var managedProcess = {
      id: processInfo.id,
      update: sinon.stub()
    }

    connection._processes[managedProcess.id] = managedProcess

    connection.startProcess.callsArgWithAsync(2, undefined, processInfo)

    connection._overrideProcessInfoMethods()

    connection.startProcess('script', 'options', function (error, started) {
      expect(error).to.not.exist
      expect(started).to.equal(managedProcess)

      done()
    })
  })

  it('should override startProcess method and propagate error', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var error = new Error('Urk!')

    connection.startProcess.callsArgWithAsync(2, error)

    connection._overrideProcessInfoMethods()

    connection.startProcess('script', 'options', function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should override findProcessInfoByName method and replace processInfo objects with manageProcess objects', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var processInfo = {
      id: 'foo'
    }

    var managedProcess = {
      id: processInfo.id,
      update: sinon.stub()
    }

    connection._processes[managedProcess.id] = managedProcess

    connection.findProcessInfoByName.callsArgWithAsync(1, undefined, processInfo)

    connection._overrideProcessInfoMethods()

    connection.findProcessInfoByName('foo', function (error, found) {
      expect(error).to.not.exist
      expect(found).to.equal(managedProcess)

      done()
    })
  })

  it('should override findProcessInfoByName method and propagate error', function (done) {
    connection.listProcesses = sinon.stub()
    connection.startProcess = sinon.stub()
    connection.findProcessInfoById = sinon.stub()
    connection.findProcessInfoByPid = sinon.stub()
    connection.findProcessInfoByName = sinon.stub()

    var error = new Error('Urk!')

    connection.findProcessInfoByName.callsArgWithAsync(1, error)

    connection._overrideProcessInfoMethods()

    connection.findProcessInfoByName('foo', function (er) {
      expect(er).to.equal(error)

      done()
    })
  })

  it('should replace processInfo with managedProcess objects in emitted events on managedProcesses', function (done) {
    var processInfo = {
      id: 'foo'
    }

    var managedProcess = new EventEmitter()
    managedProcess.id = processInfo.id
    managedProcess.update = sinon.stub()

    connection._processes[managedProcess.id] = managedProcess

    managedProcess.on('foo', function(arg) {
      expect(arg).to.equal('bar')

      done()
    })

    connection._api.sendEvent('foo', processInfo, 'bar')
  })

  it('should replace processInfo with managedProcess objects in emitted events on connection', function (done) {
    var processInfo = {
      id: 'foo'
    }

    var managedProcess = new EventEmitter()
    managedProcess.id = processInfo.id
    managedProcess.update = sinon.stub()

    connection._processes[managedProcess.id] = managedProcess

    connection.on('foo', function(proc, arg) {
      expect(proc).to.equal(managedProcess)
      expect(arg).to.equal('bar')

      done()
    })

    connection._api.sendEvent('foo', processInfo, 'bar')
  })

  it('should remove worker from cluster managed on worker:exit event', function () {
    var clusterInfo = {
      id: 'foo'
    }
    var workerInfo = {
      id: 'bar'
    }

    var manager = new EventEmitter()
    manager.id = clusterInfo.id
    manager.update = sinon.stub()
    manager.removeWorker = sinon.stub()

    var worker = new EventEmitter()
    worker.id = workerInfo.id
    worker.update = sinon.stub()

    connection._processes[manager.id] = manager
    connection._processes[worker.id] = worker

    connection._api.sendEvent('worker:exit', clusterInfo, workerInfo)

    expect(manager.removeWorker.calledWith(worker)).to.be.true
    expect(connection._processes[worker.id]).not.to.exist
  })
})
