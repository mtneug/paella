/*  
	Paella HTML 5 Multistream Player
	Copyright (C) 2017  Universitat Politècnica de València Licensed under the
	Educational Community License, Version 2.0 (the "License"); you may
	not use this file except in compliance with the License. You may
	obtain a copy of the License at

	http://www.osedu.org/licenses/ECL-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an "AS IS"
	BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
	or implied. See the License for the specific language governing
	permissions and limitations under the License.
*/


Class ("paella.PaellaPlayer", paella.PlayerBase,{
	player:null,

	videoIdentifier:'',
	loader:null,

	// Video data:
	videoData:null,

	getPlayerMode: function() {	
		if (paella.player.isFullScreen()) {
			return paella.PaellaPlayer.mode.fullscreen;
		}
		else if (window.self !== window.top) {
			return paella.PaellaPlayer.mode.embed;
		}

		return paella.PaellaPlayer.mode.standard;
	},


	checkFullScreenCapability: function() {
		var fs = document.getElementById(paella.player.mainContainer.id);
		if ((fs.webkitRequestFullScreen) || (fs.mozRequestFullScreen) || (fs.msRequestFullscreen) || (fs.requestFullScreen)) {
			return true;
		}
		if (base.userAgent.browser.IsMobileVersion && paella.player.videoContainer.isMonostream) {
			return true;
		}		
		return false;
	},

	addFullScreenListeners : function() {
		var thisClass = this;
		
		var onFullScreenChangeEvent = function() {
			setTimeout(function() {
				paella.pluginManager.checkPluginsVisibility();
			}, 1000);

			var fs = document.getElementById(paella.player.mainContainer.id);
			
			if (paella.player.isFullScreen()) {				
				fs.style.width = '100%';
				fs.style.height = '100%';
			}
			else {
				fs.style.width = '';
				fs.style.height = '';
			}
			
			if (thisClass.isFullScreen()) {
				paella.events.trigger(paella.events.enterFullscreen);				
			}
			else{
				paella.events.trigger(paella.events.exitFullscreen);
			}			
		};
	
		if (!this.eventFullScreenListenerAdded) {
			this.eventFullScreenListenerAdded = true;
			document.addEventListener("fullscreenchange", onFullScreenChangeEvent, false);
			document.addEventListener("webkitfullscreenchange", onFullScreenChangeEvent, false);
			document.addEventListener("mozfullscreenchange", onFullScreenChangeEvent, false);	
			document.addEventListener("MSFullscreenChange", onFullScreenChangeEvent, false);
			document.addEventListener("webkitendfullscreen", onFullScreenChangeEvent, false);
		}
	},

	isFullScreen: function() {
		var webKitIsFullScreen = (document.webkitIsFullScreen === true);
		var msIsFullScreen = (document.msFullscreenElement !== undefined && document.msFullscreenElement !== null);
		var mozIsFullScreen = (document.mozFullScreen === true);
		var stdIsFullScreen = (document.fullScreenElement !== undefined && document.fullScreenElement !== null);
		
		return (webKitIsFullScreen || msIsFullScreen || mozIsFullScreen || stdIsFullScreen);
	},

	goFullScreen: function() {
		if (!this.isFullScreen()) {
			if (base.userAgent.system.iOS &&
				(paella.utils.userAgent.browser.Version.major<12 ||
				 !paella.utils.userAgent.system.iPad))
			{
				paella.player.videoContainer.masterVideo().goFullScreen();
			}
			else {			
				var fs = document.getElementById(paella.player.mainContainer.id);		
				if (fs.webkitRequestFullScreen) {			
					fs.webkitRequestFullScreen();
				}
				else if (fs.mozRequestFullScreen){
					fs.mozRequestFullScreen();
				}
				else if (fs.msRequestFullscreen) {
					fs.msRequestFullscreen();
				}
				else if (fs.requestFullScreen) {
					fs.requestFullScreen();
				}
			}
		}
	},
	
	exitFullScreen: function() {
		if (this.isFullScreen()) {			
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.msExitFullscreen()) {
				document.msExitFullscreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}								
		}		
	},


	setProfile:function(profileName,animate) {
		if (paella.profiles.setProfile(profileName,animate)) {
			let profileData = paella.player.getProfile(profileName);
			if (profileData && !paella.player.videoContainer.isMonostream) {
				base.cookies.set('lastProfile', profileName);
			}
			paella.events.trigger(paella.events.setProfile,{profileName:profileName});
		}
	},

	getProfile:function(profileName) {
		return paella.profiles.getProfile(profileName);
	},

	initialize:function(playerId) {
		this.parent(playerId);

		// if initialization ok
		if (this.playerId==playerId) {
			this.loadPaellaPlayer();
			var thisClass = this;
		}

		Object.defineProperty(this,'selectedProfile',{
			get: function() {
				return paella.profiles.currentProfileName;
			}
		});
	},

	loadPaellaPlayer:function() {
		var This = this;
		this.loader = new paella.LoaderContainer('paellaPlayer_loader');
		$('body')[0].appendChild(this.loader.domElement);
		paella.events.trigger(paella.events.loadStarted);

		paella.initDelegate.loadDictionary()
			.then(function() {
				return paella.initDelegate.loadConfig();
			})

			.then(function(config) {
				This.accessControl = paella.initDelegate.initParams.accessControl;
				This.videoLoader = paella.initDelegate.initParams.videoLoader;
				This.onLoadConfig(config);
				if (config.skin) {
					var skin = config.skin.default || 'dark';
					paella.utils.skin.restore(skin);
				}
			});
	},

	onLoadConfig:function(configData) {
		paella.data = new paella.Data(configData);
		paella.pluginManager.registerPlugins();

		this.config = configData;
		this.videoIdentifier = paella.initDelegate.getId();

		if (this.videoIdentifier) {
			if (this.mainContainer) {
				this.videoContainer = new paella.VideoContainer(this.playerId + "_videoContainer");
				var videoQualityStrategy = new paella.BestFitVideoQualityStrategy();
				try {
					var StrategyClass = this.config.player.videoQualityStrategy;
					var ClassObject = Class.fromString(StrategyClass);
					videoQualityStrategy = new ClassObject();
				}
				catch(e) {
					base.log.warning("Error selecting video quality strategy: strategy not found");
				}
				this.videoContainer.setVideoQualityStrategy(videoQualityStrategy);
				
				this.mainContainer.appendChild(this.videoContainer.domElement);
			}
			$(window).resize(function(event) { paella.player.onresize(); });
			this.onload();
		}
		
		paella.pluginManager.loadPlugins("paella.FastLoadPlugin");
	},

	onload:function() {
		var thisClass = this;
		var ac = this.accessControl;
		var canRead = false;
		var userData = {};
		this.accessControl.canRead()
			.then(function(c) {
				canRead = c;
				return thisClass.accessControl.userData();
			})

			.then(function(d) {
				userData = d;
				if (canRead) {
					thisClass.loadVideo();
				}
				else if (userData.isAnonymous) {
					var redirectUrl = paella.initDelegate.initParams.accessControl.getAuthenticationUrl("player/?id=" + paella.player.videoIdentifier);
					var message = '<div>' + base.dictionary.translate("You are not authorized to view this resource") + '</div>';
					if (redirectUrl) {
						message += '<div class="login-link"><a href="' + redirectUrl + '">' + base.dictionary.translate("Login") + '</a></div>';
					}
					thisClass.unloadAll(message);
				}
				else {
					let errorMessage = base.dictionary.translate("You are not authorized to view this resource");
					thisClass.unloadAll(errorMessage);
					paella.events.trigger(paella.events.error,{error:errorMessage});
				}
			})

			.catch((error) => {
				let errorMessage = base.dictionary.translate(error);
				thisClass.unloadAll(errorMessage);
				paella.events.trigger(paella.events.error,{error:errorMessage});
			});
	},

	onresize:function() {		
		this.videoContainer.onresize();
		if (this.controls) this.controls.onresize();

		// Resize the layout profile
		if (this.videoContainer.ready) {
			var cookieProfile = paella.utils.cookies.get('lastProfile');
			if (cookieProfile) {
				this.setProfile(cookieProfile,false);
			}
			else {
				this.setProfile(paella.player.selectedProfile, false);
			}
		}
		
		paella.events.trigger(paella.events.resize,{width:$(this.videoContainer.domElement).width(), height:$(this.videoContainer.domElement).height()});
	},

	unloadAll:function(message) {
		var loaderContainer = $('#paellaPlayer_loader')[0];
		this.mainContainer.innerText = "";
		paella.messageBox.showError(message);
	},

	reloadVideos:function(masterQuality,slaveQuality) {
		if (this.videoContainer) {
			this.videoContainer.reloadVideos(masterQuality,slaveQuality);
			this.onresize();
		}
	},

	loadVideo:function() {
		if (this.videoIdentifier) {
			var This = this;
			var loader = paella.player.videoLoader;
			this.onresize();
			loader.loadVideo(() => {
				var playOnLoad = false;
				This.videoContainer.setStreamData(loader.streams)
					.then(function() {
						paella.events.trigger(paella.events.loadComplete);
						This.addFullScreenListeners();
						This.onresize();
						if (This.videoContainer.autoplay()) {
							This.play();
						}
					})
					.catch((error) => {
						console.log(error);
					});
			});
		}
	},

	showPlaybackBar:function() {
		if (!this.controls) {
			this.controls = new paella.ControlsContainer(this.playerId + '_controls');
			this.mainContainer.appendChild(this.controls.domElement);
			this.controls.onresize();
			paella.events.trigger(paella.events.loadPlugins,{pluginManager:paella.pluginManager});

		}
	},

	isLiveStream:function() {
		if (this._isLiveStream===undefined) {
			var loader = paella.initDelegate.initParams.videoLoader;
			var checkSource = function(sources,index) {
				if (sources.length>index) {
					var source = sources[index];
					for (var key in source.sources) {
						if (typeof(source.sources[key])=="object") {
							for (var i=0; i<source.sources[key].length; ++i) {
								var stream = source.sources[key][i];
								if (stream.isLiveStream) return true;
							}
						}
					}
				}
				return false;
			};
			this._isLiveStream = checkSource(loader.streams,0) || checkSource(loader.streams,1);
		}
		return this._isLiveStream;
	},

	loadPreviews:function() {
		var streams = paella.initDelegate.initParams.videoLoader.streams;
		var slavePreviewImg = null;

		var masterPreviewImg = streams[0].preview;
		if (streams.length >=2) {
			slavePreviewImg = streams[1].preview;
		}
		if (masterPreviewImg) {
			var masterRect = paella.player.videoContainer.overlayContainer.getVideoRect(0);
			this.masterPreviewElem = document.createElement('img');
			this.masterPreviewElem.src = masterPreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.masterPreviewElem,masterRect);
		}
		if (slavePreviewImg) {
			var slaveRect = paella.player.videoContainer.overlayContainer.getVideoRect(1);
			this.slavePreviewElem = document.createElement('img');
			this.slavePreviewElem.src = slavePreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.slavePreviewElem,slaveRect);
		}
		paella.events.bind(paella.events.timeUpdate,function(event) {
			paella.player.unloadPreviews();
		});
	},

	unloadPreviews:function() {
		if (this.masterPreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.masterPreviewElem);
			this.masterPreviewElem = null;
		}
		if (this.slavePreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.slavePreviewElem);
			this.slavePreviewElem = null;
		}
	},

	loadComplete:function(event,params) {
		var thisClass = this;

		//var master = paella.player.videoContainer.masterVideo();


		paella.pluginManager.loadPlugins("paella.EarlyLoadPlugin");
		if (paella.player.videoContainer._autoplay){
			this.play();
		}		
	},

	play:function() {
		return new Promise((resolve,reject) => {
			this.videoContainer.play()
				.then(() => {
					if (!this.controls) {
						this.showPlaybackBar();
						paella.events.trigger(paella.events.controlBarLoaded);
						this.controls.onresize();
					}
					resolve();
				})
				.catch((err) => {
					reject(err);
				});
		});
	},

	pause:function() {
		return this.videoContainer.pause();
	},

	playing:function() {
		return new Promise((resolve) => {
			this.paused()
				.then((p) => {
					resolve(!p);
				});
		});
	},

	paused:function() {
		return this.videoContainer.paused();
	}
});

var PaellaPlayer = paella.PaellaPlayer;

paella.PaellaPlayer.mode = {
	standard: 'standard',
	fullscreen: 'fullscreen',
	embed: 'embed'
};

/* Initializer function */
function initPaellaEngage(playerId,initDelegate) {
	if (!initDelegate) {
		initDelegate = new paella.InitDelegate();
	}
	paella.initDelegate = initDelegate;
	paellaPlayer = new PaellaPlayer(playerId,paella.initDelegate);
}
