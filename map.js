// TODO: export comments to external db
// TODO: edit comment timestamps
var contextStack = [];
function showTop() {
    var c = contextStack[0];
    c && c.show();
}
function hideTop() {
    var c = contextStack[0];
    c && c.hide();
}
function dropTop() {
    var c = contextStack[0];
    c && c.drop();
}
function pushContext(context, noHide) {
    noHide || hideTop();
    contextStack.unshift(context);
}
function popContext() {
    dropTop();
    contextStack.shift();
    showTop();
}
function startTransparency(videoPosition, parentContext, closeReporter = nop) {
    const borderWidth = 3;
    var bye, clear, setDrawColor;
    M(['div',
       ['style', ['position', 'absolute'],
        ['top', videoPosition.top + 'px'],
        ['left', videoPosition.left + 'px']],
       ['with', function (container) {
           bye = function () {
               popContext();
               container.remove();
           };
       }],
       ['canvas',
        ['attr', ['height', videoPosition.height - borderWidth + 'px'],
         ['width', videoPosition.width - borderWidth + 'px']],
        ['style', ['border', borderWidth + "px solid black"]],
        ['with', function (canvas) {
            var ox, oy;
            function beginDrawing(e) {
                var x = e.pageX, y = e.pageY;
                e.preventDefault();
                if (e.touches && e.touches.length === 2) {
                    clear();
                    return;
                }
                if (e.touches && e.touches[0]) {
                    ox = videoPosition.getLeft();
                    oy = videoPosition.getTop();
                    x = e.touches[0].pageX - ox;
                    y = e.touches[0].pageY - oy;
                }
                ctx.moveTo(x, y);
                ctx.beginPath();
                drawing = true;
            }
            function doDrawing(e) {
                var x = e.layerX, y = e.layerY;
                if (drawing) {
                    e.preventDefault();
                    if (e.touches && e.touches[0]) {
                        ox = videoPosition.getLeft();
                        oy = videoPosition.getTop();
                        x = e.touches[0].pageX - ox;
                        y = e.touches[0].pageY - oy;
                    }
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.moveTo(x, y);
                }
            }
            function endDrawing(e) {
                e.preventDefault();
                drawing = false;
                ctx.closePath();
            }
            var drawing, ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            clear = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            };
            setDrawColor = function (color) {
                ctx.strokeStyle = color;
                canvas.style.border = borderWidth + "px solid " + color;
            };
            M(['on', ['touchstart', beginDrawing], ['mousedown', beginDrawing],
               ['touchmove', doDrawing], ['mousemove', doDrawing],
               ['touchend', endDrawing], ['mouseup', endDrawing]], canvas);
        }]],
       ['div',
        ['style', ['display', 'inline-block'], ['verticalAlign', 'top'],
         ['border', '1px solid black']],
        ['with', colorListDiv => {
            var colors = ['black', 'white',
                          'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
            colors.forEach(color => {
                M(['div', '&nbsp;',
                   ['style', ['width', '50px'], ['height', '50px'],
                    ['cursor', 'pointer'], ['background', color]],
                   ['on', ['click', () => {
                       setDrawColor(color);
                   }]]], colorListDiv);
            });
        }]]], document.body);
    pushContext(Object.assign({}, parentContext, {
        Backspace : clear,
        Escape : bye,
        drop : () => {
            closeReporter();
        }
    }), true);
    return { close : bye, setColor : setDrawColor };
}
function describeContext(description) {
    M(['div',
       ['style', ['position', 'fixed'],
        ['background', '#ccc'],
        ['borderTopLeftRadius', '5px'],
        ['borderBottomLeftRadius', '5px'],
        ['right', '0'], ['top', '0']],
       ['with', div => {
           function bye() {
               div.remove();
               document.body.removeEventListener('keydown', bye);
           }
           Object.entries(description).forEach(entry => {
               M(['div',
                  ['pre', JSON.stringify(entry)]], div);
           });
           document.body.addEventListener('keydown', bye);
       }]], document.body);
}
function installKeyHandler() {
    var updRegDisplay, reg = '';
    function regPusher(k) {
        if (k.length === undefined || k.length > 1) { return; }
        return function () {
            reg += k;
            updRegDisplay();
        };
    }
    function contextFun(k) {
        var f = contextStack[0][k];
        if (!f) { return; }
        return function (e) {
            e.preventDefault();
            f(reg);
            reg = '';
            updRegDisplay();
        };
    }
    M(['div',
       ['style', ['position', 'fixed'], ['bottom', '0'],
        ['right', '0'], ['background', '#ccc']],
       ['with', n => {
           updRegDisplay = () => {
               n.innerHTML = reg;
           };
       }]], document.body);
    M(['on', ['keydown', function (e) {
        var k = e.key,
            f = contextFun(k) || regPusher(k) || nop;
        f(e);
    }]], document.body);
    window.addEventListener('beforeunload', e => {
        var f = contextStack[0].unload;
        f && f();
    });
}
function overlay() {
    var i,
        bye,
        content = ['div',
                   ['style', ['minWidth', '200px'], ['maxWidth', '600px'],
                    ['margin', '100px auto'], ['padding', '2em'],
                    ['borderRadius', '10px'], ['background', 'white']]],
        a = ['div', content,
             ['with', function (n) { bye = function () { n.remove(); }; }],
             ['style', ['position', 'fixed'], ['top', 0], ['left', 0],
              ['background', 'rgba(0, 0, 0, 0.5)'],
              ['width', window.innerWidth + 'px'],
              ['height', window.innerHeight + 'px']]];
    for (i = 0; i < arguments.length; i++) {
        content.push(arguments[i]);
    }
    M(a, document.body);
    return bye;
}
function btn(label, onClick, withFun) {
    return ['div', label,
            ['style', ['display', 'inline-block'],
             ['border', '2px solid gray'], ['borderRadius', '5px'],
             ['cursor', 'pointer'], ['padding', '3px 7px']],
            ['with', function (n) {
                if (withFun) {
                    withFun(n);
                }
            }],
            ['on', ['click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                onClick(e);
            }]]];
}
function bookmark2timestamp(bookmark) {
    var match, minutes, seconds;
    if (!bookmark) { return; }
    match = bookmark.match(/(\d+):(\d\d)/);
    minutes = +match[1];
    seconds = +match[2];
    return 60 * minutes + seconds;
}
function video(data, showDemo, mods) {
    var context = {},
        noteUpdaters = {},
        markMap = {},
        src = (data.type === "slice" && !showDemo ? data.lesson : data).localLink,
        timestamp = bookmark2timestamp(data.bookmark || (mods && mods.bookmark)),
        demo = data.silentDemo || !data.course.nodemo, getVideoPosition,
        getTime, setTime, shiftTime, getSpeed, setSpeed, paused, pause, displayNote,
        play, togglePlay, setMark, toMark, shrink, unShrink, getDuration,
        withResumePosition, setResumePosition,
        dimOtherSpeedBtn, addComment, setMarkLabel, showPosition, showCurrentSlice;
    function speedBtn(factor, checked) {
        var dim, lite;
        return [btn, factor.toFixed(1), function clicker(e) {
            setSpeed(factor);
            lite();
        }, function with_fun(b) {
            dim = function () { b.style.background = 'none'; };
            lite = function () {
                dimOtherSpeedBtn && dimOtherSpeedBtn();
                dimOtherSpeedBtn = dim;
                b.style.background = 'lightgreen';
            };
            checked && lite();
        }];
    }
    M(['div',
       ['with', function (n) {
           context.show = () => { n.style.display = 'block'; };
           context.hide = () => { n.style.display = 'none'; };
           context.drop = () => { n.remove(); };
       }],
       ['h1', data.course.name,
        ['on', ['click', e => {
            context.Escape();
        }]]],
       aif(data.chapter || (data.lesson && data.lesson.chapter),
           chapter => ['h2', 'Chapter: ' + chapter.number + '. ' + chapter.name],
           () => ['div']),
       ['h3',
        (function (l) {
            return 'Lesson ' + l.number + ': ' + l.name;
        }(data.lesson ? data.lesson : data))],
       (showDemo ? ['h4', 'Silent Demo: ' + data.name] : ['div']),
       ['div',
        ['style', ['margin', '5px 0']],
        [btn, '&laquo;', function () { shiftTime(getSpeed() * -3); }],
        [btn, 'PP', function () { togglePlay(); }],
        [btn, '&raquo;', function () { shiftTime(getSpeed() * 3); }],
        [speedBtn, 0.2],
        [speedBtn, 0.5],
        [speedBtn, 0.7],
        [speedBtn, 1.0, true],
        [speedBtn, 1.3],
        [speedBtn, 1.5],
        [btn, 'mark', function (e) {
            var ts = setMark();
            e.target.innerHTML = 'm: ' + ts.toFixed(1);
            e.target.title = 'mark at: ' + ts;
        }, function (div) {
            setMarkLabel = function (ts) {
                div.innerHTML = 'm: ' + ts.toFixed(1);
                div.title = 'mark at: ' + ts;
            };
        }],
        [btn, 'to mark', function () { toMark && toMark(); }],
        [btn, 'smaller', function () { shrink(); }],
        [btn, 'bigger', function () { unShrink(); }],
        [btn, 'comment', function () { addComment(); }]],
       ['video',
        ['attr', ['controls', 'true'], ['autoplay', 'true'], ['src', src]],
        ['style', ['maxWidth', '100%']],
        ['on', ['timeupdate', e => {
            var t = getTime();
            showPosition(t, e.target.duration);
            showCurrentSlice(t);
        }]],
        ['with', function (v) {
            withResumePosition = function (f) {
                var resumePosition = localStorage.getItem(src + '.resume');
                if (resumePosition) {
                    f(resumePosition);
                }
            };
            setResumePosition = function (p) {
                localStorage.setItem(src + '.resume', p);
            };
            getVideoPosition = function () {
                return {
                    "left" : v.offsetLeft,
                    "top" : v.offsetTop,
                    "height" : v.clientHeight,
                    "width" : v.clientWidth,
                    "getLeft" : function () { return v.offsetLeft; },
                    "getTop" : function () { return v.offsetTop; },
                };
            };
            getTime = function () { return v.currentTime; };
            setTime = function (t) { return v.currentTime = t; };
            shiftTime = function (t) { return v.currentTime += t; };
            getSpeed = function () { return v.playbackRate; };
            setSpeed = function (s) { return v.playbackRate = s; };
            pause = function () { v.pause(); };
            paused = function () { return v.paused; };
            play = function () { v.play(); };
            togglePlay = function () {
                if (v.paused) {
                    v.play();
                } else {
                    v.pause();
                }
                return !v.paused;
            };
            setMark = function (s, setIndex) {
                const mark = s == undefined ? v.currentTime : s;
                if (setIndex !== undefined) {
                    markMap[setIndex] = mark;
                }
                toMark = function (jumpIndex) {
                    const undefinedTarget = jumpIndex === undefined || jumpIndex === null;
                    const jumpTarget = undefinedTarget ? mark : markMap[jumpIndex];
                    v.currentTime = jumpTarget;
                    return jumpTarget;
                };
                return mark;
            };
            shrink = function () { v.style.width = (v.clientWidth * 0.9) + 'px'; };
            unShrink = function () { v.style.width = (v.clientWidth * 1.1) + 'px'; };
            addComment = function () {
                var ts = getTime(),
                    vid = src;
                var ta, bye = overlay([
                    'div',
                    ['div', vid],
                    ['div', sec2minsec(ts) + " (" + ts + ")"],
                    ['div',
                     ['textarea',
                      ['attr', ['rows', '10'], ['cols', '40']],
                      ['with', function (n) {
                          ta = n;
                          n.value = localStorage.getItem(vid + '@' + ts);
                          M(['on', ['keydown', e => { e.stopPropagation(); }]], n);
                      }]]],
                    ['button', 'Save', ['on', ['click', function () {
                        localStorage.setItem(vid + '@' + ts, ta.value);
                        aif(noteUpdaters[ts], f => {
                            f(ta.value);
                        }, () => {
                            displayNote({ timestamp : ts, text : ta.value });
                        });
                        bye();
                    }]]],
                    ['button', 'Cancel', ['on', ['click', function () {
                        bye();
                    }]]]]);
                ta.focus();
            };
            if (timestamp !== undefined) {
                setTime(timestamp);
                setMark(timestamp);
            } else {
                withResumePosition(resumePosition => {
                    setTime(resumePosition);
                    setMark(resumePosition);
                });
            }
            if (src.match(/\.d\d\./)) {
                v.loop = true;
            }
            if (mods && mods.onEnd) {
                v.addEventListener('ended', mods.onEnd);
            }
        }]],
       ['div', '??:??',
        ['with', function (n) {
            showPosition = function (p, d) {
                var s = Math.round(100 * getSpeed());
                n.innerHTML = p.toFixed(3) + ' / ' + d.toFixed(3) +
                              ', ' + sec2minsec(p) + " / " + sec2minsec(d) +
                              ' @ ' + s + '% speed';
            };
        }]],
       ['div',
        ['div',
         ['style', ['display', 'inline-block'], ['width', '50%'],
          ['verticalAlign', 'top'], ['borderRight', '1px solid black']],
         ['table',
          ['attr', ['border', 0], ['cellspacing', 0], ['cellpadding', 2]],
          ['style', ['width', '100%']],
          ['with', function (table) {
              var colorizers = [],
                  slices = data.slices ||
                           (data.lesson && !showDemo && data.lesson.slices);
              showCurrentSlice = nop;
              if (!slices) { return; }
              showCurrentSlice = function (t) {
                  colorizers.some(arr => {
                      var lo = arr[0],
                          hi = arr[1],
                          f = arr[2],
                          current = lo < t && t < hi;
                      f(current);
                  });
              };
              slices.forEach(slice => {
                  var timestamp = bookmark2timestamp(slice.bookmark);
                  M(['tr',
                     ['with', row => {
                         if (colorizers[0]) { colorizers[0][1] = timestamp; }
                         colorizers.unshift([timestamp, 10 * 60 * 60 * 1000, on => {
                             row.style.background = on ? 'lightgreen' : 'none';
                         }]);
                     }],
                     ['td', slice.bookmark.slice(1),
                      ['style', ['cursor', 'pointer'], ['maxWidth', '70px'], ['verticalAlign', 'top']],
                      ['on', ['click', function () {
                          setTime(timestamp);
                          setMark(timestamp);
                      }]]],
                     ['td', slice.number + '. ' + slice.name,
                      ['style', ['cursor', slice.silentDemo ? 'pointer' : 'auto']],
                      ['on', ['click', function () {
                          if (!slice.silentDemo) { return; }
                          pause();
                          video(slice, true);
                      }]]]], table);
              });
              [['rddBookmark', 'Reflex Development Drill'],
               ['fpBookmark', 'Fight Philosophy'],
               ['rmdBookmark', 'Rapid Mastery Drill'],
               ['fsBookmark', 'Fight Simulation Drill'],
               ['mmBookmark', 'Mindset Minute']].forEach(pair => {
                   var timestamp,
                       fieldName = pair[0],
                       fieldValue = (data.type === 'slice' ? data.lesson : data)[fieldName],
                       label = pair[1];
                   if (fieldValue) {
                       timestamp = bookmark2timestamp(fieldValue);
                       M(['tr',
                          ['with', row => {
                              colorizers[0][1] = timestamp;
                              colorizers.unshift([timestamp, 10 * 60 * 60 * 1000, on => {
                                  row.style.background = on ? 'lightgreen' : 'none';
                              }]);
                          }],
                          ['td', fieldValue,
                           ['style', ['cursor', 'pointer'], ['maxWidth', '70px']],
                           ['on', ['click', function () {
                               setTime(timestamp);
                               setMark(timestamp);
                           }]]],
                          ['td', label]], table);
                   }
               });
          }]]],
        ['div',
         ['style', ['display', 'inline-block'], ['width', '50%'],
          ['verticalAlign', 'top']],
         ['with', function (div) {
             displayNote = function (note) {
                 var removeNoteDisplay;
                 M(['div',
                    ['with', noteDisplay => {
                        removeNoteDisplay = () => noteDisplay.remove();
                    }],
                    ['div', sec2minsec(note.timestamp),
                     ['attr', ['title', note.timestamp]],
                     ['style', ['display', 'inline-block'], ['cursor', 'pointer'],
                      ['verticalAlign', 'top'],
                      ['color', 'blue'], ['textDecoration', 'underline']],
                     ['on', ['click', function () {
                         setTime(+note.timestamp);
                         setMark(+note.timestamp);
                     }]]],
                    ['div', ":",
                     ['style', ['display', 'inline-block'], ['margin', '0 5px'],
                      ['verticalAlign', 'top']]],
                    ['div',
                     ['style', ['display', 'inline-block'], ['cursor', 'pointer'],
                      ['verticalAlign', 'top']],
                     ['with', textSpan => {
                         note.text.split(/[\n\r]+/).forEach(line => {
                             M(['div', line], textSpan);
                         });
                         noteUpdaters[note.timestamp] = text => {
                             note.text = text;
                             textSpan.innerHTML = text;
                         };
                         M(['on', ['click', () => {
                             const original = note.text;
                             var ta, bye = overlay([
                                 'div',
                                 ['div', src],
                                 ['div', sec2minsec(note.timestamp) + " (" + note.timestamp + ")"],
                                 ['div',
                                  ['textarea',
                                   ['attr', ['rows', '10'], ['cols', '40']],
                                   ['with', function (n) {
                                       ta = n;
                                       n.value = note.text;
                                       M(['on', ['keydown', e => { e.stopPropagation(); }]], n);
                                   }]]],
                                 ['button', 'Save', ['on', ['click', function () {
                                     var edited = ta.value;
                                     if (original !== edited) {
                                         note.text = edited;
                                         localStorage.setItem(src + '@' + note.timestamp, note.text);
                                         textSpan.innerHTML = '';
                                         note.text.split(/[\n\r]+/).forEach(line => {
                                             M(['div', line], textSpan);
                                         });
                                     }
                                     bye();
                                 }]]],
                                 ['button', 'Cancel', ['on', ['click', function () {
                                     bye();
                                 }]]],
                                 ['button', 'Delete',
                                  ['style', ['marginLeft', '1em']],
                                  ['on', ['click', function () {
                                      if (!confirm("Really delete this note?")) { return; }
                                      localStorage.removeItem(src + '@' + note.timestamp);
                                      removeNoteDisplay();
                                      bye();
                                  }]]]]);
                             ta.focus();
                         }]], textSpan);
                     }]]], div);
             };
             withResumePosition(rp => {
                 M(['div', 'resume at: ',
                    ['span', sec2minsec(rp),
                     ['style', ['color', 'blue'], ['textDecoration', 'underline'],
                      ['cursor', 'pointer']],
                     ['on', ['click', e => {
                         setTime(+rp);
                         setMark(+rp);
                     }]]]], div);
             });
             console.log('getting local notes for "' + src + '"');
             getLocalNotes().filter(note => {
                 return src === note.src;
             }).sort((a, b) => {
                 var at = +a.timestamp, bt = +b.timestamp;
                 return at > bt ? 1 : at < bt ? -1 : 0;
             }).forEach(displayNote);;
         }]]]], document.body);
    context.Escape = () => {
        setResumePosition(getTime());
        popContext();
    };
    context.unload = () => {
        var ts = getTime();
        setResumePosition(ts);
    };
    context[' '] = togglePlay;
    context.ArrowLeft = function () {
        var shift = paused() ? -0.17 : -3 * getSpeed();
        shiftTime(shift);
    };
    context.ArrowRight = function () {
        var shift = paused() ? 0.17 : 3 * getSpeed();
        shiftTime(shift);
    };
    context.c = addComment;
    context.d = function (prefix) {
        var slices, slice, n, match;
        if (data.course.nodemo) { console.log({ nodemo4 : data, prefix }); return; }
        match = prefix.match(/(\d)\D*$/);
        if (!match) { console.log(['ERROR: missing id for demo', prefix, data]); return; }
        n = +match[1];
        slices = data.slices || data.lesson.slices;
        slice = slices && slices[n - 1];
        if (!slice) { console.log(['ERROR: no slice id', prefix, data]); return; }
        pause();
        video(slices[n - 1], true);
    };
    context.s = function (prefix) {
        var slices, slice, n, match, timestamp;
        match = prefix.match(/(\d+)\D*$/);
        if (!match) { console.log(['ERROR: missing id for slice', prefix, data]); return; }
        n = +match[1];
        slices = data.slices || data.lesson.slices;
        slice = slices && slices[n - 1];
        if (!slice) { console.log(['ERROR: no slice id', prefix, data]); return; }
        timestamp = bookmark2timestamp(slice.bookmark);
        setTime(timestamp);
        setMark(timestamp);
    };
    context.r = function (prefix) {
        var match = prefix.match(/\d+/g),
            rate = match && match.pop(),
            div;
        if (!rate) {
            alert("ERROR: no numbers in prefix for playback rate command\n" + prefix);
            return;
        }
        div = Math.pow(10, rate[0] < 2 ? rate.length - 1 : rate.length);
        setSpeed(rate / div);
    };
    context.j = function (prefix) {
        var match = prefix.match(/\d+/g),
            time = match && match.pop();
        if (!time) {
            alert("ERROR: no numbers in prefix for jump-to-time command\n" + prefix);
            return;
        }
        setTime(time);
    };
    context.m = function (prefix) {
        var match = prefix.match(/(\d)\D*$/) || undefined,
            index = match && match[1];
        console.log({ prefix, index });
        setMarkLabel(setMark(undefined, index));
    }; 
    context.l = (function () {
        var stopLoop;
        function startLoop(prefix) {
            var a, b, toid,
                matches = prefix.match(/\d/g) || [],
                marks = matches.map(index => markMap[index]);
            function augment() {
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].some(index => {
                    var mark = markMap[index];
                    if (mark === undefined) { return; }
                    marks.push(mark);
                    if (marks.length > 1) { return true; }
                });
            }
            if (marks.length < 2) { augment(); }
            if (marks.length < 2) {
                alert("looping requires at least two marks");
                return;
            }
            marks.reverse();
            a = Math.min(marks[0], marks[1]);
            b = Math.max(marks[0], marks[1]);
            stopLoop = () => {
                console.log({ unloopFrom : a, to : b, marks, prefix }); // DEBUG
                clearInterval(toid);
            };
            console.log({ loopFrom : a, to : b, marks, prefix }); // DEBUG
            toid = setInterval(() => {
                const t = getTime();
                if (t > b) {
                    setTime(a);
                }
            }, 40);
        }
        return function toggle_loop(prefix) {
            if (stopLoop) {
                stopLoop();
                stopLoop = undefined;
                return;
            }
            startLoop(prefix);
        };
    }());
    context.t = function (prefix) {
        var match, index;
        if (!toMark) { return; }
        match = prefix.match(/(\d)\D*$/);
        index = match && match[1];
        toMark(index);
    };
    context.T = function () {
        startTransparency(getVideoPosition(), context);
    };
    context.z = unShrink;
    context.Z = shrink;
    context['?'] = () => {
        describeContext({
            '[escape]' : 'Jump back to the previous context',
            '[space]' : 'Play/pause',
            '[left arrow]' : 'If paused, frame backward, else jump backward three seconds scaled by the playback rate',
            '[right arrow]' : 'If paused, frame forward, else jump forward three seconds scaled by the playback rate',
            'c' : 'Comment at the current time',
            'j' : 'Jump to prefixed time (seconds)',
            'd' : 'Jump to prefixed demo number',
            's' : 'Jump to prefixed slice number',
            'r' : 'Set playback rate to prefixed number (< 2x)',
            'm' : 'Set the mark',
            'l' : 'loop between two marks',
            't' : 'Jump to the mark',
            'T' : 'Toggle transparency drawing',
            'z' : 'Zoom in',
            'Z' : 'Zoom out',
            'markMap' : JSON.stringify(markMap)
        });
    };
    pushContext(context);
}
function playAllMindsetMinutes(filters, random) {
    var lessons = lessonList.filter(lesson => lesson.mmBookmark);
    function showNext(x) {
        var lesson = lessons[x];
        if (!lesson) { return; }
        video(lesson, false, {
            bookmark : lesson.mmBookmark,
            onEnd : () => {
                popContext();
                return showNext(x + 1);
            }
        });
    }
    if (filters) {
        lessons = lessons.filter(lesson => {
            return filters.every(f => f(lesson));
        });
        if (random) {
            lessons = shuffle(lessons);
        }
    }
    showNext(0);
}
function showAList(list, title) {
    var context = {};
    M(['div',
       ['with', function (n) {
           context.show = () => { n.style.display = 'block'; };
           context.hide = () => { n.style.display = 'none'; };
           context.drop = () => { n.remove(); };
       }],
       ['div', ['button', 'Close', ['on', ['click', function () {
           popContext();
       }]]]],
       ['with', function (n) {
           var selectors = [], dimmers = [], liters = [], maxNdx, curNdx = 0;
           function prevNdx() {
               dimmers[curNdx]();
               curNdx = curNdx ? curNdx - 1 : maxNdx;
               liters[curNdx]();
           }
           function nextNdx() {
               dimmers[curNdx]();
               curNdx = curNdx === maxNdx ? 0 : curNdx + 1;
               liters[curNdx]();
           }
           function pickNdx(n) {
               if (isNaN(n)) { return; }
               dimmers[curNdx]();
               curNdx = n;
               liters[curNdx]();
           }
           n.innerHTML = '';
           M(['h3', title], n);
           M(['div', list.length + ' items'], n);
           list.forEach((item, ndx) => {
               var dimMe, liteMe, selectMe;
               M(['div', (1 + ndx) + '. ' + (item.name || item.text) + " (" + item.type + ")",
                  (item.course ? ['span', " (course: " + item.course.name + ")"] : ['span']),
                  (item.lesson ? ['span', " (lesson: " + item.lesson.name + ")"] : ['span']),
                  ['style', ['border', '2px solid white'], ['cursor', 'pointer']],
                  ['on', ['click', () => { selectMe(); }]],
                  ['with', div => {
                      liteMe = function () {
                          div.style.border = '2px solid lightgreen';
                          window.scrollTo(0, div.offsetTop - div.clientHeight - window.innerHeight / 2);
                      };
                      dimMe = function () {
                          div.style.border = '2px solid white';
                      };
                      selectMe = function () {
                          function showCourse(item) {
                              if (item.type !== 'course') { return; }
                              showAList(item.lessons, 'Course: ' + item.name);
                              return true;
                          }
                          function showLesson(item) {
                              if (item.type !== 'lesson') { return; }
                              video(item);
                              return true;
                          }
                          function showSlice(item) {
                              if (item.type !== 'slice') { return; }
                              video(item);
                              return true;
                          }
                          function showTest(item) {
                              if (item.type !== 'test') { return; }
                              video(item);
                              return true;
                          }
                          function showNote(item) {
                              if (item.type !== 'note') { return; }
                              video(item);
                              return true;
                          }
                          console.log({ selectedItem : item, ndx });
                          showCourse(item) ||
                          showTest(item) ||
                          showNote(item) ||
                          showLesson(item) ||
                          showSlice(item);
                      };
                      dimmers.push(dimMe);
                      liters.push(liteMe);
                      selectors.push(selectMe);
                  }]], n);
               maxNdx = ndx;
           });
           liters[curNdx] && liters[curNdx]();
           context.p = prevNdx;
           context.n = nextNdx;
           context.Enter = () => selectors[curNdx] && selectors[curNdx]();
           context.j = id => pickNdx(id - 1);
       }]], document.body);
    context.Escape = popContext;
    context['?'] = () => {
        describeContext({
            '[escape]' : 'Jump back to the previous context',
            '[enter]' : 'Open context on a selected item',
            'p' : 'Step upward in the list',
            'n' : 'Step downward in the list',
            'j' : 'Jump to prefixed index in the list'
        });
    };
    pushContext(context);
}
function namesOf(item) {
    return item.name +
           (item.course ? ' ' + item.course.name : '') +
           (item.chapter ? ' ' + item.chapter.name : '') +
           (item.lesson ? ' ' + item.lesson.name : '') +
           (item.text ? ' ' + item.text : '');
}
function searchFor(searchString) {
    var tokens = searchString.trim().split(/\s+/),
        needles = tokens.filter(token => token[0] !== '!'),
        bangs = tokens.filter(token => token[0] === '!'),
        bangMap = {
            '!mm' : function mindset_minutes_only(hay) {
                console.log({ bang : '!mm', hay });
                return hay.type === 'lesson' && hay.mmBookmark;
            }
        };
    function match(hay) {
        var map = {},
            list = [];
        needles.forEach(needle => {
            var reg = new RegExp(needle, 'ig'),
                m = hay.match(reg);
            if (m) {
                list.push(...m);
                map[needle] = 1 + (map[needle] || 0);
            }
        });
        return { map, list };
    }
    function promptClose() {
       if (!confirm("Really discard search results?")) { return; }
       popContext();
    }
    function search() {
        return courseList.concat(lessonList, sliceList, testList, getLocalNotes()).map(item => {
            var matches = match(namesOf(item)),
                found = matches.list.length;
            return found && { matches, item };
        }).filter(searchResult => {
            function bangOk() {
                if (bangs.length === 0) { return true; }
                return bangs.every(bang => bangMap[bang](searchResult.item));
            }
            return searchResult && bangOk();
        }).sort((a, b) => {
            var at = a.matches.list.length,
                bt = b.matches.list.length,
                au = Object.keys(a.matches.map).length,
                bu = Object.keys(b.matches.map).length;
            return au < bu ? 1 :
                   au > bu ? -1 :
                   at < bt ? 1 :
                   at > bt ? -1 : 0;
        }).map(result => {
            result.item.searchMatches = result.matches;
            return result.item;
        });
    }
    showAList(search(), "Search results (" + searchString + ")");
}
function searchUI() {
    var inp, context = {};
    M(['div',
       ['div',
        ['button', 'all mindset minutes',
         ['on', ['click', () => { playAllMindsetMinutes([], true); }]]],
        ['button', 'WE 2.0 mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'Women Empowered 2.0');
             }]);
         }]]],
        ['button', 'combatives mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'Gracie Combatives');
             }]);
         }]]],
        ['button', 'BBS 1 mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'BBS 1');
             }]);
         }]]],
        ['button', 'BBS 2 mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'BBS 2');
             }]);
         }]]],
        ['button', 'BBS 3 mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'BBS 3');
             }]);
         }]]],
        ['button', 'BBS 4 mindset minutes',
         ['on', ['click', () => {
             playAllMindsetMinutes([function (item) {
                 return item.course && (item.course.name === 'BBS 4');
             }]);
         }]]],
        ['button', 'WE 2.0',
         ['on', ['click', () => {
             var context = { Escape : popContext },
                 allWE2 = lessonList.filter(l => l.course.name.match('2.0'));
             M(['div', ['with', mapDiv => {
                 M(['div', ['button', 'Close', ['on', ['click', e => {
                     popContext();
                 }]]]], mapDiv);
                 allWE2.forEach(l => {
                     var toggleList;
                     M(['div',
                        ['div', l.number + ": " + l.name,
                         ['style', ['cursor', 'pointer'],
                          ['display', 'inline-block'],
                          ['margin', '5px 0 0 5px'],
                          ['borderBottom', '2px solid lightgray']],
                         ['on', ['click', e => {
                             toggleList();
                         }]]],
                        ['ol',
                         ['style', ['display', 'none']],
                         ['with', lessonDiv => {
                             var on;
                             toggleList = () => {
                                 on = !on;
                                 lessonDiv.style.display = on ? 'block' : 'none';
                             };
                             l.slices.forEach(slice => {
                                 M(['li', slice.name,
                                    ['style', ['cursor', 'pointer']],
                                    ['on', ['click', e => {
                                        video(slice);
                                    }]]], lessonDiv);
                             });
                         }]]], mapDiv);
                 });
                 context.show = () => { mapDiv.style.display = 'block'; };
                 context.hide = () => { mapDiv.style.display = 'none'; };
                 context.drop = () => { mapDiv.remove(); };
             }]], document.body);
             pushContext(context);
         }]]],
        ['button', 'Combatives map',
         ['on', ['click', () => {
             var context = { Escape : popContext },
                 allCombatives = lessonList.filter(l => l.course.name.match('Gracie Combatives 2.0'));
             M(['div', ['with', mapDiv => {
                 M(['div', ['button', 'Close', ['on', ['click', e => {
                     popContext();
                 }]]]], mapDiv);
                 allCombatives.forEach(l => {
                     var toggleList;
                     M(['div',
                        ['div', l.number + ": " + l.name,
                         ['style', ['cursor', 'pointer'],
                          ['display', 'inline-block'],
                          ['margin', '5px 0 0 5px'],
                          ['borderBottom', '2px solid lightgray']],
                         ['on', ['click', e => {
                             toggleList();
                         }]]],
                        ['ol',
                         ['style', ['display', 'none']],
                         ['with', lessonDiv => {
                             var on;
                             toggleList = () => {
                                 on = !on;
                                 lessonDiv.style.display = on ? 'block' : 'none';
                             };
                             l.slices.forEach(slice => {
                                 M(['li', slice.name,
                                    ['style', ['cursor', 'pointer']],
                                    ['on', ['click', e => {
                                        video(slice);
                                    }]]], lessonDiv);
                             });
                         }]]], mapDiv);
                 });
                 context.show = () => { mapDiv.style.display = 'block'; };
                 context.hide = () => { mapDiv.style.display = 'none'; };
                 context.drop = () => { mapDiv.remove(); };
             }]], document.body);
             pushContext(context);
         }]]],
        ['button', 'BBS map',
         ['on', ['click', () => {
             var allBBS = lessonList.filter(l => l.localLink.match('bbs')),
                 chapterMap = {},
                 context = {},
                 totalLessons = 0,
                 totalSlices = 0;
             context.Escape = popContext;
             allBBS.forEach(l => {
                 if (!chapterMap[l.chapter.name]) {
                     chapterMap[l.chapter.name] = [];
                 }
                 chapterMap[l.chapter.name].push(l);
             });
             M(['div', ['with', chapterListDiv => {
                 M(['div', ['button', 'Close', ['on', ['click', e => {
                     popContext();
                 }]]]], chapterListDiv);
                 Object.entries(chapterMap).forEach(([chapterName, chapterLessons]) => {
                     M(['div',
                        ['style', ['display', 'inline-block'],
                         ['borderTop', '1px solid gray'],
                         ['width', '50%'], ['verticalAlign', 'top']],
                        ['span', chapterName,
                         ['style', ['fontWeight', 'bold']]],
                        ['ol',
                         ['with', ol => {
                             chapterLessons.forEach(l => {
                                 const stripeNumber = l.course.name.match(/\d/)[0];
                                 var toggleSublist;
                                 totalLessons += 1;
                                 M(['li',
                                    ['span', l.name + ' (' + stripeNumber + '.' + l.number + ')',
                                     ['style', ['cursor', 'pointer']],
                                     ['on', ['click', e => {
                                         toggleSublist();
                                     }]]],
                                    ['style', ['background', l.course.name.match(/\d/)[0] % 2 ? 'lightgray' : 'none']],
                                    ['ol',
                                     ['style', ['display', 'none']],
                                     ['attr', ['type', 'i']],
                                     ['with', sliceOL => {
                                         var on;
                                         toggleSublist = () => {
                                             on = !on;
                                             sliceOL.style.display = on ? 'block' : 'none';
                                         };
                                         l.slices.forEach(slice => {
                                             totalSlices += 1;
                                             M(['li', slice.name,
                                                ['style', ['cursor', 'pointer']],
                                                ['on', ['click', e => {
                                                    video(slice);
                                                }]]], sliceOL);
                                         });
                                     }]]], ol);
                             });
                         }]]], chapterListDiv);
                 });
                 M(['div', 'totalLessons: ' + totalLessons], chapterListDiv);
                 M(['div', 'totalSlices: ' + totalSlices], chapterListDiv);
                 context.show = () => { chapterListDiv.style.display = 'block'; };
                 context.hide = () => { chapterListDiv.style.display = 'none'; };
                 context.drop = () => { chapterListDiv.remove(); };
             }]], document.body);
             pushContext(context);
         }]]],
        ['button', 'PBS list',
         ['on', ['click', () => {
             var allPBS = lessonList.filter(l => l.course.name.match('PBS') && l.name.match('Princ')),
                 context = {};
             context.Escape = popContext;
             M(['div',
                ['with', listDiv => {
                    M(['button', 'Close', ['on', ['click', e => {
                        popContext();
                    }]]], listDiv);
                    allPBS.forEach(l => {
                        M(['div', l.name,
                           ['style', ['cursor', 'pointer']],
                           ['on', ['click', e => {
                               video(l);
                           }]]], listDiv);
                    });
                    context.show = () => { listDiv.style.display = 'block'; };
                    context.hide = () => { listDiv.style.display = 'none'; };
                    context.drop = () => { listDiv.remove(); };
                }]], document.body);
             pushContext(context);
         }]]]],
       ['with', function (n) {
           context.show = () => { n.style.display = 'block'; inp.focus(); };
           context.hide = () => { n.style.display = 'none'; };
           context.drop = () => { n.remove(); };
       }],
       ['input',
        ['attr', ['placeholder', 'search']],
        ['style', ['fontSize', '4em'], ['width', '100%'],
         ['marginTop', '4em']],
        ['with', function (n) {
            inp = n;
        }]]], document.body);
    inp.focus();
    context.Enter = () => searchFor(inp.value);
    pushContext(context);
}
////////////////////
buildDB();
installKeyHandler();
searchUI();
