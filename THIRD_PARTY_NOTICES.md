# Third-party notices

The Frictionborn Motion code is MIT licensed (see [LICENSE](LICENSE)). The notices below are kept apart from that file so that
licence detection (GitHub, npm, scanners) sees a plain MIT licence.

## Ashima Arts & Stefan Gustavson, WebGL noise (noise-field, mesh-gradient)

The noise functions in the `noise-field` and `mesh-gradient` shaders are derived from Ashima Arts and Stefan Gustavson's WebGL noise implementation (https://github.com/stegu/webgl-noise).

```
Copyright (C) 2011 Ashima Arts. All rights reserved.
Copyright (C) 2011 Stefan Gustavson. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Demo images

The `distortion-image` demo uses public-domain (CC0) works from The Metropolitan Museum of Art Open Access collection. They are
demo content, are not part of the registry items and are not stored in this repository (`scripts/fetch-demo-assets.ts` downloads them).

## Runtime dependency

`smooth-scroll` depends on [`lenis`](https://github.com/darkroomengineering/lenis) (MIT, Darkroom Engineering). It is installed from npm by the shadcn CLI and is not copied into this repository.
