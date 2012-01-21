var Queue = { 
	manualList: [],
    autoList: [],
    manualPlayIndex: null,
    autoPlayIndex: null,
    init: function() {
    
    },
    addManual: function(video) {
        Queue.manualList.push(video);  
        Queue.updateView();
    },
    setAutoQueue: function(videoList) {
        Queue.autoPlayIndex = 0;
        Queue.autoList = videoList;
        Queue.updateView();
    },
    manualPlay: function(index) {
        console.log('manual ' + index);
        if (Queue.manualList.length === 0) {
            return false;
        }
        
        if (index < 0 || index > Queue.manualList.length -1) {
            return false;
        } else {
            Queue.manualPlayIndex = index;
        }
        Queue.manualList[Queue.manualPlayIndex].play();
        Queue.autoPlayIndex = null;
        Queue.updateView();
        return true;
    },
    autoPlay: function(index) {
        console.log('auto ' + index);
        if (Queue.autoList.length === 0) {
            return false;
        }
        
        if (index < 0 || index > Queue.autoList.length -1) {
            return false;
        } else {
            Queue.autoPlayIndex = index;
        }
        Queue.autoList[Queue.autoPlayIndex].play();
        Queue.updateView();
        return true;
    },
    playNext: function() {
        if ((Queue.manualList.length + Queue.autoList.length) === 0) {
            return false;
        }
        
        if (Queue.manualList.length > 0 && Queue.manualPlayIndex === null) {
            return Queue.manualPlay(0);
        } else if (Queue.manualList.length > 0 && Queue.manualPlayIndex + 1 < Queue.manualList.length) {
            return Queue.manualPlay(Queue.manualPlayIndex + 1);
        } else if (Queue.autoList.length > 0 && Queue.autoPlayIndex === null) {
            return Queue.autoPlay(0);
        } else if (Queue.autoList.length > 0 && Queue.autoPlayIndex + 1 < Queue.autoList.length) {
            return Queue.autoPlay(Queue.autoPlayIndex + 1);
        } else {
            return false;
        }
    },
    playPrev: function() {
        if ((Queue.manualList.length + Queue.autoList.length) === 0) {
            return false;
        }
        
        if (Queue.autoPlayIndex !== null && Queue.autoPlayIndex > 0) {
            return Queue.autoPlay(Queue.autoPlayIndex - 1);
        } else if (Queue.autoPlayIndex !== null && Queue.autoPlayIndex === 0) {
            return Queue.manualPlay(Queue.manualList.length - 1);
        } else if (Queue.manualPlayIndex !== null && Queue.manualPlayIndex > 0) {
            return Queue.manualPlay(Queue.manualPlayIndex - 1);
        } else {
            return false;
        }
    },
	updateView: function() {
        var view = Menu.find('queue').findTab('queue').paneView;
        
        view.html('');
        $.each(Queue.manualList, function(index, video) {
			var clone = video.listView.clone(),
                play = function() {
                    Queue.manualPlay(index);
                };
            
            /* Clean */
            clone.removeClass('selected').removeClass('playing');
            
            /* Is Playing? */
            if (index === Queue.manualPlayIndex && Queue.autoPlayIndex === null) {
                clone.addClass('playing');
            }
                        
            /* Bind actions */
            clone.dblclick(play);
            clone.find('.play').click(play);
            
            /* Only display the last 3 */
            if (Queue.manualPlayIndex !== null && index - Queue.manualPlayIndex < -2) {
                clone.hide();
            }
            clone.appendTo(view);
		});
        $.each(Queue.autoList, function(index, video) {
			var clone = video.listView.clone(),
                play = function() {
                    Queue.autoPlay(index);
                };
            
            /* Clean */
            clone.removeClass('selected').removeClass('playing');
            
            /* Is Playing? */
            if (index === Queue.autoPlayIndex) {
                clone.addClass('playing');
            }
                        
            /* Bind actions */
            clone.dblclick(play);
            clone.find('.play').click(play);
            
            /* Make movable */
            clone.data('model', video);
            clone.addClass('draggable');
            
            clone.appendTo(view);
		});
	},
    
    addSiblingsToPlayorder: function(startElem) {
        if (startElem === undefined) {
			return;
        }
		var list = [];
        
		if ($('#bottom .shuffle').hasClass('on')) {
            /* Add all videos */
            $(startElem).siblings('.video').each(function(index, item) {
                list.push($(item).data('model'));
            });
			$.shuffle(list);
		} else {
            /* Add videos after this */
            $(startElem).nextAll('.video').each(function(index, item) {
                list.push($(item).data('model'));
            });
        }
        list.unshift($(startElem).data('model'));
        Queue.setAutoQueue(list);
	},
};
