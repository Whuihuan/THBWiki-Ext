QueryString = {
    data: {},
    Initial: function () {
        var aPairs, aTmp;
        var queryString = new String(window.location.search);
        queryString = queryString.substr(1, queryString.length);
        aPairs = queryString.split("&");
        for (var i = 0; i < aPairs.length; i++) {
            aTmp = aPairs[i].split("=");
            this.data[aTmp[0]] = aTmp[1];
        }
    },
    GetValue: function (key) {
        return this.data[key];
    }
}
QueryString.Initial();

//Get Query
var action = QueryString.GetValue("action");
var title = decodeURI(QueryString.GetValue("title"));

//Get Status
var editstatus = (action == "edit") ? true : false;
var lyricstatus = (title.indexOf("歌词:") >= 0) ? true : false;

var loadCssCode = (code) => {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.rel = 'stylesheet';
    //for Chrome Firefox Opera Safari
    style.appendChild(document.createTextNode(code));
    //for IE
    //style.styleSheet.cssText = code;
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
}

var loadScript = (code) => {
    var script = document.createElement('script');
    script.innerHTML = code;
    document.head.appendChild(script);
}

var setbg = () => {
    var css = `body{
        background-color:#ffffff00!important;
    }
    
    #mw-page-base,#mw-head-base,#mw-panel{
        --foreground-color-high:auto!important;
    }
    
    #mw-panel{
        --foreground-color-high:#ffffffcc!important;
    }
    #mw-panel .portal{
        background-color:#ffffff00!important;
    }
    
    #p-personal,#footer{
        background-color: #ffffffcc!important;
    }
    
    #content
    {
        background-color: #ffffffcc;
    }
    
    .portal ul>li
    {
        background-color: #ffffff00!important;
    }
    
    .portal li ul li
    {
        background-color: #ffffffff!important;
    }`;
    loadCssCode(css);
}

var setthbextbg = (url) => {
    setbg();
    loadCssCode(`.thbextbg{background-image:url(${url})!important;}`);
    $("html").addClass(`mainbg thbextbg`);
}
var background = true;
var custombackground = false;
var custombgurl = "";
var tag = true;
var netease = false;
var aplayer = false;
var custombanner = false;
var custombnop = "";
var custombnurl = "";
var inpageedit = false;

chrome.storage.local.get(['options'], (res) => {
    if (res.options) {
        background = res.options.background;
        custombackground = res.options.custombackground;
        custombgurl = res.options.custombgurl || '';
        tag = res.options.tag;
        netease = res.options.netease;
        aplayer = res.options.aplayer;
        custombanner = res.options.custombanner;
        custombnop = res.options.custombnop || '';
        custombnurl = res.options.custombnurl || '';
        inpageedit = res.options.inpageedit;
    }
});

$().ready(() => {
    //过于花里胡哨的提示
    console.log(`  _____   _   _   ____  
    |_   _| | | | | | __ ) 
      | |   | |_| | |  _ \ 
      | |   |  _  | | |_) |
      |_|   |_| |_| |____/ 
                           `);

    // 仅unicorn皮肤生效
    if (background && $("body").hasClass("skin-unicorn")) {
        let defurl = `${apiurl}Background.php`;
        if (custombackground) {
            var url = custombgurl || defurl;
            setthbextbg(url);
        }
        else {
            //根据词条判断背景
            var word = $("#firstHeading").text().replace(/ /g, "_");
            var url = `${defurl}?char=${word}&type=1`;
            $.get(url, {}, (res) => {
                $("#p-namespaces ul").append($(`<li id='ca-nstab-saveBackground'><span><a href='${res}' target='_blank'>查看背景图片</a></span></li>`));
                setthbextbg(res);
            });
        }
    }
    if (custombanner) {
        let url = "";
        if (custombnop == "customer") {
            url = custombnurl;
        }
        else {
            url = custombnop;
        }
        if (url) {
            if ($("#ca-nstab-main").text() == '首页') {
                // 仅unicorn和vampire皮肤生效
                var skins = ["skin-unicorn", "skin-vampire"];
                var hasSkin = false;
                for (var index in skins) {
                    hasSkin = $(`.${skins[index]}`).length > 0;
                    if (hasSkin) break;
                }
                if (hasSkin) {
                    loadCssCode("#siteNotice{text-shadow: #252525 -1px -1px 1px, #252525 1px -1px 1px, #252525 -1px 1px 1px, #252525 1px 1px 1px;color: #CBA461;}");
                    loadCssCode(`.page-首页 div#content.mw-body{background-image:url(${url})!important;}`);
                }
            }
        }
    }

    if (inpageedit) {
        var script = `!(function() {
  // RLQ是MediaWiki保存异步执行函数的数组
  window.RLQ = RLQ || [];
  RLQ.push(() => {
    // 等待jQuery加载完毕
    var _count = 0;
    var _interval = setInterval(() => {
      _count++;
      if (typeof jQuery !== "undefined") {
        // jQuery加载完毕
        clearInterval(_interval);
        // 防止网站并不是MediaWiki时报错
        try {
          mw.loader.load("https://cdn.jsdelivr.net/npm/mediawiki-inpageedit@latest/dist/InPageEdit.min.js");
        } catch (e) {}
      } else if (_count > 30 * 5) {
        // 加载超时
        clearInterval(_interval);
      }
    }, 200);
  });
})();`;
        loadScript(script);
    }
    // //替换底部标签
    // if ($("#mw-normal-catlinks ul").length > 0) {
    //     $("#mw-normal-catlinks ul li").each(function () {
    //         if ($(this).hasClass(".noprint")) return;
    //         var a = $(this).find("a");
    //         var name = a.text();
    //         var title = a.attr("title");
    //         var href = a.attr("href");
    //         $(this).html(`<el-link type='primary' href='${href}' title='${title}'>${name}</el-link>`);
    //     });
    //     new Vue({
    //         el: "#catlinks",
    //         data() {

    //         }
    //     });
    // }

    //修改页面
    if (editstatus) {
        var toolbarReady = null;
        toolbarReady = setInterval(() => {
            if ($(".wikiEditor-ui-toolbar .tabs").length > 0) {
                clearInterval(toolbarReady);

                // 哔哩哔哩BV号转换
                $(".wikiEditor-ui-toolbar .tabs").append($(`<span class='tab tab-bilibili' rel='bilibili'><a href='#' role='button' aria-pressed='false' aria-controls='wikiEditor-section-bilibili' class=''>插入转换后的哔哩哔哩BV号</a></span>`));

                $(".tab-bilibili").on("click", function () {
                    let bvid = prompt("请输入BV号（非完整地址）", "");

                    let table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
                    let tr = {};
                    for (let i = 0; i < 58; i++) {
                        tr[table[i]] = i;
                    }
                    let s = [11, 10, 3, 8, 4, 6];
                    let xor = 177451812,
                        add = 8728348608;

                    let r = 0;
                    for (let i = 0; i < 6; i++) {
                        r += tr[bvid[s[i]]] * Math.pow(58, i);
                    }
                    let avid = (r - add) ^ xor;
                    insertText($("textarea")[0], avid);
                    return false;
                });
            }
        }, 1000);
        var fundiv = "";
        //歌词修改
        if (lyricstatus) {
            if (netease) {
                let subtitle = title.substring("歌词:".length);
                let groupname = (subtitle.indexOf("（") > 0) ? subtitle.substring(subtitle.indexOf("（") + 1, subtitle.length - "）".length) : "";
                let songname = subtitle.replace("（" + groupname + "）", "");
                //添加网易云音乐歌词获取
                fundiv += `<pre><el-button type="info" @click="getNetLyric('${songname}','${groupname}')">网易云歌词获取</el-button><el-card class="box-card" v-if="songs.length>0"><div v-for="song in songs">{{song.name}}　<strong>{{song.album.name}}</strong>　<el-button type="success" @click="clickSong(song.id)" size="mini">选择</el-button></div></el-card><transition name="el-fade-in-linear"><div v-if="lyricUrl"><iframe id="lyricframe" allowTransparency="true" style="background-color:#66ccff;width:100%" :src="lyricUrl"></iframe><el-button type="danger" @click="closeNetLyric">关闭</el-button></div></transition></pre>`;
            }
        }
        // fundiv += `<pre><el-button type="info" :disabled="text?false:'disabled'" @click="loadTmpText(true)">加载草稿</el-button><el-button type="primary" @click="saveTmpText">保存草稿</el-button> 上一次保存草稿时间：{{lasttime}}</pre>`
        var div = `<div id='ext-editform'>${fundiv}</div>`;
        $(".mw-editform").before($(div));
        new Vue({
            el: "#ext-editform",
            data() {
                return {
                    lyricUrl: '',
                    songs: [],
                    text: '',
                    // lasttime: null
                }
            },
            created() {
                // this.lasttime = new Date(localStorage.getItem(`${title}-time`) || null).Format("yyyy-MM-dd hh:mm:ss");
                // this.loadTmpText();
            },
            methods: {
                getNetLyric(songname, groupname) {
                    $.get(`${apiurl}NetSearch.php?limit=5&name=${songname}+${groupname}`, (res) => {
                        if (res.code == 200) {
                            this.songs = res.result.songs;
                        }
                    });
                },
                clickSong(id) {
                    this.lyricUrl = `${apiurl}NetLyric.php?id=${id}&format=thb`;
                },
                closeNetLyric() {
                    this.lyricUrl = "";
                },
                // loadTmpText(apply) {
                //     this.text = localStorage.getItem(title) || '';
                //     if (apply) {
                //         $("#wpTextbox1").val(this.text);
                //     }
                // },
                // saveTmpText() {
                //     this.text = $("#wpTextbox1").text();
                //     localStorage.setItem(title, this.text);
                //     this.lasttime = new Date();
                //     localStorage.setItem(`${title}-time`, this.lasttime);
                // }
            }
        });
    }
    else {
        //短链替换
        if ($("#mw-indicator-0 a").length > 0) {
            if ($("#profile-toggle-button").length > 0) {
                $("#profile-toggle-button").css("margin-top", "2rem");
            }
            var sortlink = $("#mw-indicator-0 a").attr("href");
            $("#mw-indicator-0 a").remove();
            $("#mw-indicator-0").append($("<el-button type='primary' @click='copySortLink'>复制短链接</el-button>"));
            new Vue({
                el: "#mw-indicator-0",
                data() {
                    return {
                        sortlink: '',
                        lyricUrl: '',
                        songs: []
                    }
                },
                created() {
                    this.sortlink = sortlink;
                },
                methods: {
                    copySortLink() {
                        var link = `${window.location.protocol}//${window.location.host}${this.sortlink}`;
                        var res = copyToClipboardText(link);
                        if (res) {
                            this.$message({
                                message: "复制短链接成功！",
                                type: 'success',
                                showClose: true
                            });
                        }
                        else {
                            this.$message.error('复制短链接失败！');
                        }
                    }
                }
            });
        }

        if (tag) {
            //修改歧义分类
            var understate = "";
            if ($("#firstHeading .understate").length > 0) {
                understate = $("#firstHeading .understate").text().replace(/\（|）/g, '');
                $("#firstHeading .understate").remove();
            }
            if ($(".searchaux").length > 0) {
                understate = $(".searchaux").attr("title");
            }
            var parseState = (name) => {
                var arr = {
                    "社团": "同人社团",
                    "人物": "现实人物",
                    "展会": "同人展会",
                    "角色": "新作角色",
                    "小说": "官方小说",
                    "漫画": "官方漫画",
                };
                return arr[name] || name;
            }
            if (understate) {
                var type = "";
                understate = parseState(understate);
                switch (understate) {
                    case "同人专辑":
                    case "同人视频":
                    case "同人软件":
                    case "同人志":
                    case "商业游戏":
                    case "周边":
                        type = "primary";
                        break;
                    case "同人社团":
                    case "现实人物":
                    case "同人展会":
                        type = "success";
                        break;
                    case "新作角色":
                    case "旧作角色":
                    case "同人角色":
                    case "相关角色":
                        type = "info";
                        break;
                    case "弹幕游戏":
                    case "格斗游戏":
                    case "原曲":
                    case "官方小说":
                    case "官方漫画":
                        type = "danger";
                        break;
                    default:
                        type = "warning";
                        break;
                }
                $("#firstHeading").append($(`<el-tag effect='dark' type='${type}' style='margin-left: 0.5rem;'>${understate}</el-tag>`));
            }
            new Vue({
                el: "#firstHeading",
                data() {

                }
            });
        }

        if (aplayer) {
            var understate = $(".searchaux").attr("title");
            if (understate == "同人专辑") {
                var circle = "";
                var album = "";
                $(".doujininfo tr").each((i, v) => {
                    let circleflag = false;
                    let albumflag = false;
                    $(v).children().each((i1, v1) => {
                        let label = $(v1).text();
                        if (albumflag && !album) {
                            album = label.trim();
                        }
                        else if (circleflag && !circle) {
                            circle = label.trim();
                        }
                        if (label == "名称") {
                            albumflag = true;
                        }
                        else if (label == "制作方") {
                            circleflag = true;
                        }
                    });
                });
                if (album && circle) {
                    $(".musicTable").attr("id", "musicapp");
                    $(".musicTable tr").eq(0).before($(`<tr v-show="songs.length > 0"><td colspan="4"><div id="aplayer"></td></tr>`));
                    // $(".musicTable .title").each((i, v) => {
                    //     var name = $(v).text();
                    //     $(v).find(".thcsearchlinks").before($(`<el-button type="success" size="mini" v-show="songs.filter(v => v.name == '${name}').length > 0">点击播放</el-button>`));
                    // });
                    new Vue({
                        el: "#musicapp",
                        data() {
                            return {
                                songs: [],
                                aplayer: null
                            };
                        },
                        watch: {
                            songs(newval, oldval) {
                                if (newval.length > 0) {
                                    var musics = [];
                                    newval.forEach((v, i) => {
                                        musics.push({
                                            title: v.name,
                                            artist: v.ar[0].name,
                                            cover: v.al.picUrl,
                                            url: `http://music.163.com/song/media/outer/url?id=${v.id}.mp3`,
                                            lrc: `${apiurl}NetLyric.php?id=${v.id}`
                                        });
                                    });
                                    this.aplayer = new APlayer({
                                        container: $("#aplayer")[0],
                                        listFolded: false,
                                        fixed: false,
                                        audio: musics,
                                        lrcType: 3,
                                        mini: false
                                    });
                                }
                                else {
                                    this.aplayer = null;
                                }
                            }
                        },
                        created() {
                            this.getNetMusic();
                        },
                        methods: {
                            getNetMusic() {
                                $.get(`${apiurl}NetAlbum.php?name=${album}&ar=${circle}`, (res) => {
                                    if (res.code == 200) {
                                        this.songs = res.songs;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    }
});