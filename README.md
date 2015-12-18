<p align="center">
  <img src="http://i.imgur.com/yH85vgu.png"/>
</p>
<h1 align="center">TinyRadio</h1>
<p align="center">An internet radio for you and your friends</p>

## What is TinyRadio?
TinyRadio is a distributed, synchronized music streaming application designed to help you share your music. Just point TinyRadio to the music you'd like to broadcast, start the server, and listen in over your local area network (LAN). Every listening client will be synchronized, so feel free to pump up the volume and listen together, or jam out silent disco style.

## Getting Started
#### Setup
TinyRadio uses node, npm, and bower. To set up your radio, clone or download this repo and run the following commands:
```
$ npm install
$ bower install
```

#### Usage
At the core of TinyRadio lies the server. It will broadcast over LAN by default, at which point everybody on the network can listen just by pointing their browsers to the given address.
```
$ node app.js  
$ Radio broadcasting at: 123.4.5.67:8000
```

By default, TinyRadio will create a ```sound``` directory under the same location as ```app.js```, which you can then populate with the music files you'd like to broadcast. If you'd prefer to play music from a pre-existing directory, just use the ```-source``` flag to point TinyRadio to the location of your music.
```
$ node app.js -source ~/my/music/library
$ Radio broadcasting at: 123.4.5.67:8000
```

If you'd prefer not to broadcast over the network, you can use the ```-private``` flag to only play on localhost:
```
$ node app.js -private
$ Radio broadcasting at: 127.0.0.1:8000
```

#### Features
 - Multiple servers broadcasting on the same local area network can see each other. To see other stations, hover over the listed IP in the client. Other server IPs will be listed in the drop down if present.
 - Music streaming is synchronized over LAN across multiple clients
 - Patterns of enqueued songs are learned to inform song selection when no music is queued up


## Troubleshooting
#### The Web Audio API
TinyRadio depends on the Web Audio API to stream music. However, the Web Audio API, being a very new technology, has some caveats. Make sure to check [the documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to get the specifics on what Web Audio can and cannot do. Some notable quirks:
 - On mobile, audio must be triggered by user interaction. Tap on the TinyRadio icon on mobile to trigger this.
 - In Safari, MP4s containing an MP3 audio codec are not supported [(source)](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats)

#### Broadcasting
TinyRadio depends on the broadcasted ports being available. If others are having trouble reaching your radio, make sure the broadcast port is not blocked by your router.

#### Dependencies
TinyRadio requires:
 - [node](https://nodejs.org/en/)
 - [ffmpeg](https://www.ffmpeg.org/)
 - [sqlite3](https://www.sqlite.org/)

Make sure you have these installed and accessible for TinyRadio to operate properly.


