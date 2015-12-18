<p align="center">
  <img src="http://i.imgur.com/yH85vgu.png"/>
</p>
<h1 align="center">TinyRadio</h1>
<p align="center">An internet radio for you and your friends.</p>

## What is TinyRadio?

## Starting your own radio
### Setup
### Usage

## Troubleshooting
#### The Web Audio API
TinyRadio depends on the WebAudio API to stream music. However, the Web Audio API, being a very new technology, has some caveats. Make sure to check [the documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to get the specifics on what Web Audio can and cannot do. Some notable quirks:
 - On mobile, audio must be triggered by user interaction. Tap on the TinyRadio icon on mobile to trigger this.
 - In Safari, MP4s containing an MP3 audio codec are not supported [(source)](https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats)

