var app = new Vue({
    el: "#app",
    data() {
        return {
            UserInfo: {
                name: '',
                realname: '',
                htmlrealname: '',
                avatar: 'https://thwiki.cc/favicon.ico',
            },
            AchievementInfo: {
            },
            Version: '',
            Search: '',
            Tab: "0",
            loginStatus: false,
            loading: [null, null, null],
            UnreadNotificationList: [],
            RemindNotificationList: [],
            MsgNotificationList: [],
            DateList: [],
            OrigMusic: '',
            OrigMusicInfo: {
                Name: '',
                Url: '',
                TranName: '',
                Game: '',
                Date: ''
            },
            Temp: {
                advancedCount: 0
            },
            Chars: {},
            Banners: [],
            Options: {
                background: true,
                custombackground: false,
                custombgurl: '',
                tag: true,
                netease: false,
                aplayer: false,
                custombanner: false,
                custombnop: '',
                custombnurl: '',
                advanced: false,
                inpageedit: false
            }
        };
    },
    created() {
        chrome.storage.local.get(['options'], (res) => {
            if (res.options) {
                this.Options.background = res.options.background;
                this.Options.custombgurl = res.options.custombgurl || '';
                this.Options.custombackground = res.options.custombackground;
                this.Options.tag = res.options.tag;
                this.Options.netease = res.options.netease;
                this.Options.aplayer = res.options.aplayer;
                this.Options.custombnop = res.options.custombnop || '';
                this.Options.custombnurl = res.options.custombnurl || '';
                this.Options.custombanner = res.options.custombanner;
                this.Options.inpageedit = res.options.inpageedit;
                this.Options.advanced = res.options.advanced;
            }
        });
        $.get(chrome.extension.getURL('manifest.json'), (info) => {
            this.Version = info.version;
        }, 'json');
        getCharTemplInfo().then(res => {
            this.Chars = JSON.parse(res);
        });
        getCustomerBanner().then((res) => {
            var nres = [{ name: '默认头图', value: '' }, { name: '自定义', value: 'customer' }];
            nres = nres.concat(res);
            this.Banners = nres;
        });
        getProjectRelaseDate().then((res) => {
            this.DateList = res;
        });
    },
    mounted() {
        checkLogin((res) => {
            this.loginStatus = res ? true : false;
            if (this.loginStatus) {
                this.UserInfo.fullname = decodeURIComponent(res).replace(/\+/g, " ");
                setTimeout(() => {
                    getUserInfo().then((res) => {
                        res.groups = res.groups.filter((v) => v != "*");
                        //取得最高权限用户组
                        var rights = ["bot", "bureaucrat", "sysop", "textop", "confirm", "preconfirm", "autoconfirmed", "user"];
                        for (var i = 0; i < rights.length; i++) {
                            var right = rights[i];
                            var group = res.groups.filter((v) => v == right);
                            if (group.length > 0) {
                                res.group = this.T(`right_${right}`);
                                break;
                            }
                        }
                        res.registrationdate = new Date(res.registrationdate).Format("yyyy年MM月dd日");
                        res.avatar = `https://upload.thwiki.cc/avatars/thwikicc_wiki_${res.id}_l.jpg?r=${Math.round(new Date().getTime()/1000)}`;
                        res.htmlrealname = this.ParseWiki(res.realname);
                        this.UserInfo = res;
                    });
                    getAchievementInfo().then(res => {
                        this.AchievementInfo = res;
                    });
                }, 200);
            }
            this.getUnreadNotification();
        });
    },
    watch: {
        Temp: {
            handler(val) {
                if (!this.Options.advanced) {
                    if (val.advancedCount >= 5) {
                        this.$message({
                            message: this.T("HiddenFunOpen"),
                            type: "success"
                        });
                        this.Options.advanced = true;
                        this.saveOptions();
                    }
                }
            },
            deep: true
        }
    },
    methods: {
        T(name) {
            return getLang(name);
        },
        ParseWiki(content) {
            let templMatch = content.match(/\{\{(.*)\}\}/g);
            if (templMatch) {
                templMatch.forEach((v) => {
                    let tmp = v;
                    tmp = tmp.substring(2, tmp.length - 2);
                    tmp = this.ParseWiki(tmp);
                    let kv = tmp.split("|");

                    let newvalue = "";
                    if (kv.length == 1) {
                        let key = kv[0];
                        if (this.Chars[`${key.toLowerCase()}`]) {
                            newvalue = this.Chars[`${key.toLowerCase()}`];
                        }
                    }
                    else if (kv.length > 1) {
                        let key = kv[0];
                        switch (key) {
                            case "黑幕":
                                {
                                    let value = kv[1];
                                    newvalue = `<span class="mask" title="你知道的太多了">${value}</span>`;
                                } break;
                        }
                    }
                    else {
                        return;
                    }
                    if (newvalue) {
                        content = content.replace(v, newvalue);
                    }
                });
            }
            let linkMatch = content.match(/\[\[(.*)\]\]/g);
            if (linkMatch) {
                linkMatch.forEach((v) => {
                    let tmp = v;
                    tmp = tmp.substring(2, tmp.length - 2);
                    tmp = this.ParseWiki(tmp);
                    let kv = tmp.split("|");

                    let newvalue = "";
                    if (kv.length == 1) {
                        let key = kv[0];
                        newvalue = `<a title='${key}'>${key}</a>`;
                    }
                    else if (kv.length > 1) {
                        let key = kv[0];
                        let value = kv[1];
                        newvalue = `<a title='${key}'>${value}</a>`;
                    }
                    else {
                        return;
                    }
                    if (newvalue) {
                        content = content.replace(v, newvalue);
                    }
                });
            }
            return content;
        },
        startLoading(obj, index) {
            if (!obj) {
                obj = $("body")[0];
            }
            this.loading[index] = this.$loading({
                lock: true,
                text: this.T("infoLoading"),
                spinner: 'el-icon-loading',
                target: obj
            });
        },
        stopLoading(index) {
            if (this.loading[index]) {
                this.loading[index].close();
                this.loading[index] = null;
            }
        },
        enterTHB(User) {
            if (User) {
                createTab(this.loginStatus ? `https://thwiki.cc/用户:${this.UserInfo.name}` : "https://thwiki.cc/特殊:用户登录");
            }
            else {
                createTab("https://thwiki.cc");
            }
        },
        changeTab(tab, event) {
            this.Tab = tab.name;
            switch (tab.name) {
                case "0":
                    this.getUnreadNotification();
                    break;
                case "1":
                    this.getRemindNotification();
                    break;
                case "2":
                    this.getMsgNotification();
                    break;
            }
        },
        getUnreadNotification() {
            this.startLoading($("#pane-0")[0], 0);
            checkUnreadNotification().then((res) => {
                this.stopLoading(0);
                if (res && res.query && res.query.notifications) {
                    let notifications = res.query.notifications;
                    let count = parseInt(notifications.count);
                    if (count == 0) {
                        chrome.browserAction.setBadgeText({ text: "" });
                        this.UnreadNotificationList = [];
                    }
                    else {
                        chrome.browserAction.setBadgeText({ text: String(count) });
                        this.UnreadNotificationList = this.formatNotification(notifications.list);
                    }
                }
            }).catch(() => {
                this.stopLoading(0);
            });
        },
        getRemindNotification() {
            this.startLoading($("#pane-1")[0], 1);
            checkRemindNotification().then((res) => {
                this.stopLoading(1);
                if (res && res.query && res.query.notifications) {
                    let notifications = res.query.notifications;
                    if (notifications.list.length <= 0) {
                        this.RemindNotificationList = [];
                    }
                    else {
                        this.RemindNotificationList = this.formatNotification(notifications.list);
                    }
                }
            }).catch(() => {
                this.stopLoading(1);
            });
        },
        getMsgNotification() {
            this.startLoading($("#pane-2")[0], 2);
            checkMsgNotification().then((res) => {
                this.stopLoading(2);
                if (res && res.query && res.query.notifications) {
                    let notifications = res.query.notifications;
                    if (notifications.list.length <= 0) {
                        this.MsgNotificationList = [];
                    }
                    else {
                        this.MsgNotificationList = this.formatNotification(notifications.list);
                    }
                }
            }).catch(() => {
                this.stopLoading(2);
            });
        },
        Read(url) {
            createTab(url);
        },
        markRead(id) {
            markNotification(id).then(result => {
                if (!result.error && result.query.echomarkread.result) {
                    if (result.query.echomarkread.result == "success") {
                        checkUnreadNotificationNum();
                        this.getUnreadNotification();
                    }
                }
            });
        },
        markAllRead() {
            var list = this.UnreadNotificationList.map(v => v = v.id).join("|");
            markNotification(list).then(result => {
                if (!result.error && result.query.echomarkread.result) {
                    if (result.query.echomarkread.result == "success") {
                        checkUnreadNotificationNum();
                        this.getUnreadNotification();
                    }
                }
            });
        },
        formatNotification(obj) {
            var topic = {
                "user-rights": this.T("userrights"),
                "social-rel": this.T("socialrel")
            };
            var msg = {
                "article-linked": this.T("articlelinked"),
                "flowthread": this.T("flowthread"),
                "flow-discussion": this.T("flowdiscussion"),
                "achiev": this.T("achiev"),
                "system": this.T("system"),
                "system-noemail": this.T("system"),
                "thank-you-edit": this.T("edit")
            };
            var isUser = [
                "user-rights",
                "social-rel",
                "article-linked",
                "flowthread",
                "flow-discussion"
            ];
            return obj.map((v => {
                return {
                    id: v.id,
                    category: v.category,
                    type: topic[v.category] ? this.T('topic') : (msg[v.category] ? this.T('msg') : ""),
                    categoryname: topic[v.category] || msg[v.category] || "",
                    agentname: isUser.indexOf(v.category) >= 0 ? v.agent.name : "",
                    icon: v["*"].icon,
                    iconurl: "https://thwiki.cc/" + v["*"].iconUrl,
                    header: v["*"].header,
                    body: v["*"].body,
                    date: dateFormat(v.timestamp.mw),
                    url: v["*"].links.primary.url
                }
            })).sort((v1, v2) => v1.date < v2.date ? 1 : -1);
        },
        searchTHB() {
            createTab(`https://thwiki.cc/index.php?search=${encodeURIComponent(this.Search)}&go=1`);
        },
        searchTHBSuggest(querystring, cb) {
            searchSuggest(querystring).then((res) => {
                res = res.map((v) => {
                    v.name = v.name.replace(new RegExp(querystring, "gi"), `<font color='#f2b040'>$&</font>`);
                    return v;
                })
                return cb(res);
            });
        },
        searchSelect(item) {
            createTab(item.url);
        },
        searchOrigMusic() {
            searchOrigMusic(this.OrigMusic).then((res) => {
                if (res && typeof (res) == 'object') {
                    this.OrigMusicInfo.Name = res.printouts.原曲名称.join();
                    this.OrigMusicInfo.Url = res.fullurl;
                    this.OrigMusicInfo.TranName = res.printouts.原曲译名.join();
                    this.OrigMusicInfo.Game = res.printouts.原曲首发作品.join();
                    this.OrigMusicInfo.Date = res.printouts.原曲首发日期[0] ? timestampFormat(res.printouts.原曲首发日期[0].timestamp) : '';
                }
                else {
                    this.OrigMusicInfo.Name = '';
                    this.OrigMusicInfo.Url = '';
                    this.OrigMusicInfo.TranName = '';
                    this.OrigMusicInfo.Game = '';
                    this.OrigMusicInfo.Date = '';
                }
            });
        },
        saveOptions() {
            var that = this;
            chrome.storage.local.set({ 'options': that.Options }, () => {
                this.$message({
                    message: this.T('SaveYes'),
                    type: 'success'
                });
            });
        },
        getStarDay(day) {
            return this.DateList.filter((v) => {
                var nday = day.split('-').slice(1).join('-');
                var nv = v.date.split('-').slice(1).join('-');
                return v.date == day || (v.date <= day && nday == nv);
            });
        },
        dateContent(daylist, day) {
            var str = "";
            var firstdaylist = daylist.filter((v) => v.date == day);
            var samedaylist = daylist.filter((v) => v.date != day);
            if (firstdaylist.length > 0) {
                firstdaylist.forEach((v) => {
                    str += `${v.name} ${this.T('CalendarRelease')}<br>`
                });
            }
            if (samedaylist.length > 0) {
                samedaylist.forEach((v) => {
                    str += `${v.name} ${new Date(day).getFullYear() - new Date(v.date).getFullYear()} ${this.T('CalendarYear')}<br>`
                });
            }
            return str;
        }
    }
});