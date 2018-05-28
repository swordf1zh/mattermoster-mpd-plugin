# Mattermoster Music Player Daemon Plugin (mattermoster-mpd-plugin)

Music Player Daemon (MPD) client plugin for Mattermoster API based on Node.js.

**[Music Player Daemon (MPD)](https://www.musicpd.org/)** is a flexible, powerful, server-side application for playing music.

**[Mattermoster](https://github.com/swordf1zh/mattermoster)** is a Node.js + Express base API for Mattermost slash command integrations.

[Mattermost](https://about.mattermost.com/) is an Open source, private cloud Slack-alternative.

## Features

  - Control MPD server from Mattermost
  - i18n ready
  - Open source!

## Installation

```sh
$ npm install --save mattermoster-mpd-plugin
```

### Adding plugin to Mattermoster

```js
const MattermosterClass = require('mattermoster');
const mattermoster = new MattermosterClass;

// ...

/**
 * Mattermoster MPD plugin
 */
const mpdPlugin = require('mattermoster-mpd-plugin');
const endpoint = '/mpd'; // you can change this
mattermoster.addPlugin(endpoint, mpdPlugin);

// ...

mattermoster.init();
```

### Mattermoster API Server

Run your Mattermoster API Server:

```sh
$ node index.js
```

You can supply a different port number for your server (defaults to 3000):

```sh
$ node index.js 12345
```

> For more information on running Mattermoster API Server read the documentation at [Mattermoster's Github repository](https://github.com/swordf1zh/mattermoster).

## Setting a Custom Slash Command in Mattermost

To create a Custom Slash Command, follow this instructions from [Mattermost's documentation](https://docs.mattermost.com/developer/slash-commands.html#custom-slash-command):

In Mattermost client (web or desktop application)...

1 - First, go to **Main Menu** > **Integrations** > **Slash Commands**. If you don’t have the Integrations option in your Main Menu, slash commands may not be enabled on your Mattermost server or may be disabled for non-admins. Enable them from **System Console** > **Integrations** > **Custom Integrations** or ask your System Administrator to do so.

2 - Click **Add Slash Command** and add name and description for the command.

3 - Set the **Command Trigger Word**. The trigger word must be unique and cannot begin with a slash or contain any spaces. It also cannot be one of the built-in commands.

4 - Set the **Request URL** and **Request Method**. The request URL is the endpoint that Mattermost hits to reach your application, and the request method is either POST or GET and specifies the type of request sent to the request URL.

> Note:
>
> This is the host:port of your Mattermoster API server.
>
> **Request Method** must be set to POST.

5 - (Optional) Set the response username and icon the command will post messages as in Mattermost. If not set, the command will use your username and profile picture.

6 - (Optional) Include the slash command in the command autocomplete list, displayed when typing / in an empty input box. Use it to make your command easier to discover by your teammates. You can also provide a hint listing the arguments of your command and a short description displayed in the autocomplete list.

7 - Hit Save.

You are done. Now try your new **Custom Slash Command** in any channel or direct message in Mattermost.

## Development

Want to contribute? Great, we are waiting for your PRs.
```sh
$ git clone https://github.com/swordf1zh/mattermoster-mpd-plugin.git
$ cd mattermoster-mpd-plugin
$ npm install
$ npm run dev
```

### Todos

 - Write tests
 - Expand troubleshooting section

## Troubleshooting

If you are running Mattermoster in the same machine that is running Mattermost, you must modify Mattermost's config.json file to [allow unstrusted internal connections](https://docs.mattermost.com/administration/config-settings.html#allow-untrusted-internal-connections-to).

## License

MIT


**Free Software, Hell Yeah!**