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
    let list, label;

    switch (cmd) {
      case 'play':
      case 'pause':
      case 'stop':
      case 'next':
      case 'prev':
        await this.command(cmd);
      case 'status':
        return await this.getCurrSongStatus();

      case 'list':
        list = await this.command('list', args);
        return this.makeMdTable(list);

      case 'shuffle':
        list = await this.command(cmd, args);
        args = [];
      case 'playlist':
        if (args[0]) {
          let index = parseInt(args[0]) - 1;
          args[0] = index + '';
        }
        list = await this.command('playlistinfo', args);
        return this.makeSongMdTable(list);

      case 'searchgenre':
      case 'searchtitle':
      case 'searchartist':
        label = cmd.substring(6);
        args.unshift(label);
        //@todo 1 Sort results by 'label'
        list = await this.command('search', args);
        return this.makeSongMdTable(list);

      case 'playgenre':
      case 'playtitle':
      case 'playartist':
        await this.command('clear');
        label = cmd.substring(4);
        args.unshift(label);
        await this.command('searchadd', args);
        await this.command('playid');
        return await this.getCurrSongStatus();

      case 'queuegenre':
      case 'queuetitle':
      case 'queueartist':
        label = cmd.substring(5);
        args.unshift(label);
        await this.command('searchadd', args);
        return await this.command('currentsong');

      case 'xx':
        let cmd = args.shift();
        return await this.command(cmd, args);

      default:
        return this.helpText;
    }
  }

  makeMdTable(json) {
    let rows = json.length ? json : [ json ];
    let headers = Object.keys(rows[0]);

    return json2md({ table: { headers, rows } });
  }

  makeSongMdTable(songJson) {
    let songs = songJson.length ? songJson : [ songJson ];
    let text = '';

    if (songs.length === 1) {
      if (!songs[0].Time) return 'No songs found!';
    } else {
      text += `Found ${songs.length} items`;
      text += (songs.length > 30) ? '. Showing first 30 items:' : ':';
    }

    let headers = `No. Artist Title Duration Genre`.split(' ');
    let rows = [];
    for (let i = 0; i < 30; i++) {
      const sObj = songs[i];
      if (!sObj) continue;
      rows.push([
        i + 1,
        sObj.Artist || '',
        sObj.Title || '',
        this.convertSeconds(sObj.Time) || '',
        sObj.Genre || '',
      ]);
    };

    return text + '\n\n' + json2md({ table: { headers, rows } });
  }

  async getCurrSongStatus() {
    let song = await this.command('currentsong');
    let stat = await this.command('status');
    let elapsed = this.convertSeconds(stat.elapsed);
    let duration = this.convertSeconds(song.Time);
    let songTitle = song.Title || 'No title';
    let text = `\`${stat.state}\` ${elapsed} / ${duration}\n${songTitle}`;
    if (song.Artist) text += `\n~ _${song.Artist}_`;
    return text;
  }

  convertSeconds(seconds) {
    let date = new Date(null);
    date.setHours(0);
    date.setSeconds(seconds);
    let h = this.pad(date.getHours(), 2);
    let m = this.pad(date.getMinutes(), 2);
    let s = this.pad(date.getSeconds(), 2);
    return (h !== '00')
           ? `${h}:${m}:${s}`
           : `${m}:${s}`;
  }

  pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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
    mmRes.text = await this.audioCmd(input_cmd, input_args);
    return mmRes;
  }

}

module.exports = new MmMpd();