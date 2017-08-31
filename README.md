# MyBB Post Notifier

> Allows the ability to send a person a PushBullet message everytime a MyBB forum post is added.

## Installation

```sh
$ git clone https://github.com/popey456963/mybb-post-notifier
$ cd mybb-post-notifier
$ npm i
$ npm start
```

## Usage

The API, by default, binds to :3070.  It contains the following endpoints:

 - `/` - Renders an HTML page to enter your PushBullet API Key.
 - `/devices?key=<key>` - Lists devices from a given key, and buttons to enable/disable them.
 - `/enable/<key>/<device_id>` - Enables a device.
 - `/disable/<key>/<device_id>` - Disables a device.

Want to run this on a forum other than `https://clwo.eu`?  You'll need to change all instances of that text to your own URL within `index.js`.

## License

ISC © [popey456963](https://github.com/popey456963)
