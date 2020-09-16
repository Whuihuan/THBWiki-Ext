var app = new Vue({
    el: "#app",
    data() {
        return {
            Version: '',
            Search: '',
            Tab: "0",
            UserName: "",
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
            Options: {
                background: true,
                custombackground: false,
                custombgurl: '',
                tag: true,
                netease: false
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
            }
        });
        $.get(chrome.extension.getURL('manifest.json'), (info) => {
            this.Version = info.version;
        }, 'json');
        checkLogin((res) => {
            this.UserName = decodeURIComponent(res).replace(/\+/g, " ");
            this.getUnreadNotification();
        });
        getProjectRelaseDate().then((res) => {
            this.DateList = res;
        });
    },
    methods: {
        _t(name) {
            return getLang(name);
        },
        startLoading(obj, index) {
            if (!obj) {
                obj = $("body")[0];
            }
            this.loading[index] = this.$loading({
                lock: true,
                text: this._t("infoLoading"),
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
                createTab(this.UserName ? `https://thwiki.cc/用户:${this.UserName}` : "https://thwiki.cc/特殊:用户登录");
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
                "user-rights": this._t("userrights"),
                "social-rel": this._t("socialrel")
            };
            var msg = {
                "article-linked": this._t("articlelinked"),
                "flowthread": this._t("flowthread"),
                "flow-discussion": this._t("flowdiscussion"),
                "achiev": this._t("achiev"),
                "system": this._t("system"),
                "system-noemail": this._t("system"),
                "thank-you-edit": this._t("edit")
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
                    type: topic[v.category] ? this._t('topic') : (msg[v.category] ? this._t('msg') : ""),
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
                    message: this._t('SaveYes'),
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
                    str += `${v.name} ${this._t('CalendarRelease')}<br>`
                });
            }
            if (samedaylist.length > 0) {
                samedaylist.forEach((v) => {
                    str += `${v.name} ${new Date(day).getFullYear() - new Date(v.date).getFullYear()} ${this._t('CalendarYear')}<br>`
                });
            }
            return str;
        }
    }
});