const debug = require('debug')('mattermoster:model-mm-mpd');
const mpd = require('mpd');
const url = require('url');
const Q = require('q');
const json2md = require('json2md');

class MmMpd {
  constructor() {
    const gbUrl = process.env.MM_MPD_URL || 'http://127.0.0.1:6600';
    this.url = url.parse(gbUrl);
    this.mpdClient = null;
    this.helpText = `
    Debe ingresar una instrucción después del comando. Ejemplo \`/audio play\`.

    Estas son las instrucciones disponibles:
      pause
      play
      stop
      next
      prev
      status
    `;
  }

  async connect() {
    this.mpdClient = mpd.connect({
      host: this.url.hostname,
      port: this.url.port
    });
    debug(`Connecting to MPD server on ${this.url.href}...`);

    const connectDeferred = Q.defer();

    this.mpdClient.on('connect', () => {
      debug('Client connected to MPD server!');
    });

    this.mpdClient.on('ready', () => {
      debug('MPD server is now ready to accept commands...');
      connectDeferred.resolve(true);
    });

    this.mpdClient.on('error', (err) => {
      debug(err);
      connectDeferred.reject('Error while connecting to MPD server');
    });

    return connectDeferred.promise;
  }

  async command(command, args) {
    command = (command === 'prev') ? 'previous' : command;
    let mpdCommand = mpd.cmd(command, args || []);
    debug(mpdCommand);

    const commandDeferred = Q.defer();
    this.mpdClient.sendCommand(mpdCommand, (err, msg) => {
      if (err) {
        debug(err);
        commandDeferred.reject('Error sending command to MPD');
      } else {
        let msgObj = this.parseKeyValueMessage(msg);
        commandDeferred.resolve(msgObj);
      }
    });

    return commandDeferred.promise;
  }

  parseKeyValueMessage(msg) {
    let msgArr = msg.split('\n');
    let output = [];
    let msgObj = {};
    msgArr.forEach((keyValMsg) => {
      let msgSplit = keyValMsg.split(': ');
      let key = msgSplit[0];
      if (!msgSplit[1]) return;
      let value = msgSplit[1].trim();
      if (msgObj[key]) {
        output.push(msgObj);
        msgObj = {};
      }
      msgObj[key] = value;
    });
    output.push(msgObj);
    return (output.length > 1) ? output : output[0];
  }

  async audioCmd(cmd, args) {
    const conn = await this.connect();

    switch (cmd) {
      case 'play':
      case 'pause':
      case 'stop':
      case 'next':
      case 'prev':
      case 'status':
        await this.command(cmd);
        return await this.command('currentsong');

      case 'playgenre':
        await this.command('clear');
        args.unshift('Genre');
        await this.command('findadd', args);
        await this.command('playid');
        return await this.command('currentsong');

      case 'queuegenre':
        args.unshift('Genre');
        await this.command('findadd', args);
        return await this.command('currentsong');

      case 'xx':
        let cmd = args.shift();
        return await this.command(cmd, args);

      default:
        return this.helpText;
    }
  }

  async do(mmData) {
    debug(mmData);

    let mmRes = {
      'response_type': 'ephemeral',
      'username': 'Sistema de audio',
      'token': mmData.token || null,
    };

    let text_input = mmData.text
                    ? mmData.text.split(' ')
                    : [];
    let input_cmd = text_input.shift();
    debug('Command: ' + input_cmd);
    let input_args = text_input;
    debug('Args:', input_args);

    // Ejecutamos comando de audio
    mmRes.text = await this.audioCmd(input_cmd, input_args)
    return mmRes;
  }

}

module.exports = new MmMpd();