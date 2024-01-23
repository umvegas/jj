const videoNames = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    'rd-mount',
    'rd-guard',
    'rd-side-mount',
    'rd-standing',
    'rd-freestyle',
];
function two(n) {
    var s = n.toString();
    if (s.length < 2) {
        s = '0' + s;
    }
    return s;
}
function s2ms(s) {
    var m = Math.floor(s / 60),
        ss = Math.round(s % 60);
    return m + ':' + two(ss);
}
M(['div',
   ['video',
    ['style', ['width', '80%']],
    ['attr',
     ['src', '1.mp4'],
     ['controls', true]],
    ['with', video => {
        var markers = [];
        function markersSet() {
            return markers[0] !== undefined && markers[1] !== undefined;
        }
        var speedButton = (function () {
            var dim;
            return function speed_button(s, defaultOn) {
                var dimMe, liteMe;
                return ['div', Math.floor(s * 100) + '%',
                        ['style',
                         ['cursor', 'pointer'],
                         ['marginRight', '.8em'],
                         ['display', 'inline-block'],
                         ['padding', '10px'],
                         ['borderRadius', '8px'],
                         ['border', '2px solid gray']],
                        ['with', btn => {
                            liteMe = () => {
                                btn.style.background = 'lightgreen';
                                dim && dim();
                                dim = dimMe;
                            };
                            dimMe = () => {
                                btn.style.background = 'none';
                            };
                            defaultOn && liteMe();
                        }],
                        ['on', ['click', e => {
                            video.playbackRate = s;
                            liteMe();
                        }]]];
            };
        }());
        function marker() {
            var showMarkTime, myNdx = markers.length;
            markers.push(undefined);
            return ['div',
                    ['style',
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['div', 'marker',
                     ['style',
                      ['textAlign', 'center'],
                      ['borderBottom', '1px solid black']],
                     ['with', labelDiv => {
                         showMarkTime = t => {
                             labelDiv.innerHTML = s2ms(t);
                         };
                     }]],
                    ['div', 'set',
                     ['style',
                      ['display', 'inline-block'],
                      ['cursor', 'pointer'],
                      ['marginTop', '5px']],
                     ['on', ['click', e => {
                         markers[myNdx] = video.currentTime;
                         showMarkTime(video.currentTime);
                     }]]],
                    ['span', ' | '],
                    ['div', 'jump',
                     ['style',
                      ['display', 'inline-block'],
                      ['cursor', 'pointer'],
                      ['marginTop', '5px']],
                     ['on', ['click', e => {
                         if (markers[myNdx] === undefined) {
                             alert('Set this marker before jumping to it');
                             return;
                         }
                         video.currentTime = markers[myNdx];
                     }]]]];
        }
        function looper() {
            var looping, intID;
            return ['div', 'loop',
                    ['style',
                     ['cursor', 'pointer'],
                     ['verticalAlign', 'top'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '1.4em 14px 1.4em 14px'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        function reset() {
                            video.currentTime = markers[0];
                        }
                        if (!markersSet()) {
                            alert('Set both markers before looping.');
                            return;
                        }
                        looping = !looping;
                        if (looping) {
                            e.target.style.background = 'lightgreen';
                            reset();
                            video.play();
                            intID = setInterval(() => {
                                if (video.currentTime > markers[1]) {
                                    reset();
                                }
                            }, 100);
                        } else {
                            e.target.style.background = 'none';
                            clearInterval(intID);
                        }
                    }]]];
        }
        function jumpBack() {
            return ['div', '&#x23EA;',
                    ['attr', ['title', 'Jump back']],
                    ['style',
                     ['cursor', 'pointer'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['minWidth', '1.4em'],
                     ['textAlign', 'center'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        video.currentTime -= video.playbackRate * 3.0;
                    }]]];
        }
        function playPause() {
            return ['div', '&#x23EF;',
                    ['attr', ['title', 'Play/Pause']],
                    ['style',
                     ['cursor', 'pointer'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['minWidth', '1.4em'],
                     ['textAlign', 'center'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        video.paused ? video.play() : video.pause();
                    }]]];
        }
        function stepBack() {
            return ['div', '|&#x1F780;',
                    ['attr', ['title', 'Step back']],
                    ['style',
                     ['cursor', 'pointer'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['minWidth', '1.4em'],
                     ['textAlign', 'center'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        video.currentTime -= .0333667;
                    }]]];
        }
        function stepForward() {
            return ['div', '&#x1F782;|',
                    ['attr', ['title', 'Step forward']],
                    ['style',
                     ['cursor', 'pointer'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['minWidth', '1.4em'],
                     ['textAlign', 'center'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        video.currentTime += .0333667;
                    }]]];
        }
        function jumpForward() {
            return ['div', '&#x23E9;',
                    ['attr', ['title', 'Jump backward']],
                    ['style',
                     ['cursor', 'pointer'],
                     ['marginRight', '1em'],
                     ['display', 'inline-block'],
                     ['padding', '10px'],
                     ['minWidth', '1.4em'],
                     ['textAlign', 'center'],
                     ['borderRadius', '8px'],
                     ['border', '2px solid gray']],
                    ['on', ['click', e => {
                        video.currentTime += video.playbackRate * 3.0;
                    }]]];
        }
        M(['div',
           ['style',
            ['marginBottom', '1em']],
           ['span', 'Lesson: '],
           ['select',
            ['with', sel => {
                M(['on', ['input', e => {
                    video.src = sel.value + '.mp4';
                }]], sel);
                videoNames.forEach(name => {
                    M(['option', name], sel);
                });
            }]]], document.body);
        M(['fieldset',
           ['legend', 'Playback Speed'],
           ['style', ['display', 'inline-block'], ['verticalAlign', 'top']],
           [speedButton, 0.2],
           [speedButton, 0.3],
           [speedButton, 0.5],
           [speedButton, 1.0, true],
           [speedButton, 1.5],
           [speedButton, 2.0]], document.body);
        M(['fieldset',
           ['legend', 'Bookmarks'],
           ['style', ['display', 'inline-block'], ['verticalAlign', 'top']],
           marker, marker, looper], document.body);
        M(['fieldset',
           ['legend', 'Play/Pause/Jump'],
           ['style', ['display', 'inline-block'], ['verticalAlign', 'top']],
           jumpBack, stepBack, playPause, stepForward, jumpForward], document.body);
    }]]], document.body);
