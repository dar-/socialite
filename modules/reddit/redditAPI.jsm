// High-level reddit commands

logger = Components.utils.import("resource://socialite/utils/log.jsm");
Components.utils.import("resource://socialite/utils/action/action.jsm");
http = Components.utils.import("resource://socialite/utils/action/httpRequest.jsm");
Components.utils.import("resource://socialite/utils/hitch.jsm");
Components.utils.import("resource://socialite/utils/quantizer.jsm");

var nativeJSON = Components.classes["@mozilla.org/dom/json;1"]
                 .createInstance(Components.interfaces.nsIJSON);

var EXPORTED_SYMBOLS = ["RedditAPI"];

QUANTIZE_TIME = 1000;

var REDDIT_API_PATH = "/api/";
function APIURL(site, op) {
  // Vote calls will 404 without the 'www.'
  return "http://www." + site + REDDIT_API_PATH + op;
}

function sameURL(func1, arg1, func2, arg2) {
  var url1 = arg1[0];
  var url2 = arg2[0];
  
  return (url1 == url2);
}

function sameLinkID(func1, arg1, func2, arg2) {
  var linkID1 = arg1[0];
  var linkID2 = arg2[0];
  
  return (linkID1 == linkID2);
}

function RedditAPI(reddit) {
  this.reddit = reddit;
  
  this.infoQuantizer = new Quantizer("reddit.info.quantizer", QUANTIZE_TIME, sameURL);
  this.info = Action("reddit.info", this.infoQuantizer.quantize(hitchThis(this, function(url, action) {
    logger.log("reddit", "Making ajax info call");
    
    var params = {
      url:    url,
      sr:     "",
      count:  1,
    };
     
    var act = http.GetAction(
      APIURL(this.reddit.auth.site, "info.json"),
      params,
      
      function success(r) {
        var json = nativeJSON.decode(r.responseText);
        action.success(r, json);
      },
      function failure(r) { action.failure(); }
    ).perform();
  })));
  
  this.randomrising = Action("reddit.randomrising", hitchThis(this, function(action) {
    logger.log("reddit", "Making ajax randomrising call");
    
    var params = {
      limit: 1,
    };
      
    var act = http.GetAction(
      "http://www.reddit.com/randomrising.json",
      params,
      
      function success(r) {
        var json = nativeJSON.decode(r.responseText);
        action.success(r, json);
      },
      function failure(r) { action.failure(); }
    ).perform();
  }));

  this.voteQuantizer = new Quantizer("reddit.vote.quantizer", QUANTIZE_TIME, sameLinkID);
  this.vote = Action("reddit.vote", this.voteQuantizer.quantize(hitchThis(this, function(linkID, isLiked, action) {
    logger.log("reddit", "Making ajax vote call");
    
    var dir;
    if (isLiked == true) {
      dir = 1;
    } else if (isLiked == false) {
      dir = -1;
    } else {
      dir = 0;
    }
    
    var params = {
      id:    linkID,
      dir:   dir,
    };
    params = this.reddit.auth.authModHash(params);
    
    var act = http.PostAction(APIURL(this.reddit.auth.site, "vote"), params);
    act.chainTo(action);
    act.perform();
  })));
  
  this.saveQuantizer = new Quantizer("reddit.save.quantizer", QUANTIZE_TIME, sameLinkID);
  this.save = Action("reddit.save", this.saveQuantizer.quantize(hitchThis(this, function(linkID, action) {
    logger.log("reddit", "Making ajax save call");
    
    var params = {
      id:    linkID,
    };
    params = this.reddit.auth.authModHash(params);
    
    var act = http.PostAction(APIURL(this.reddit.auth.site, "save"), params);
    act.chainTo(action);
    act.perform();
  })));

  this.unsave = Action("reddit.unsave", this.saveQuantizer.quantize(function(linkID, action) {
    logger.log("reddit", "Making ajax unsave call");
    
    var params = {
      id:    linkID,
    };
    params = this.reddit.auth.authModHash(params);
    
    var act = http.PostAction(APIURL(this.reddit.auth.site, "unsave"), params);
    act.chainTo(action);
    act.perform();
  }));

  this.hideQuantizer = new Quantizer("reddit.hide.quantizer", QUANTIZE_TIME, sameLinkID);
  this.hide = Action("reddit.hide", this.hideQuantizer.quantize(hitchThis(this, function(linkID, action) {
    logger.log("reddit", "Making ajax hide call");
    
    var params = {
      id:    linkID,
    };
    params = this.reddit.auth.authModHash(params);
    
    var act = http.PostAction(APIURL(this.reddit.auth.site, "hide"), params);
    act.chainTo(action);
    act.perform();
  })));

  this.unhide = Action("reddit.unhide", this.hideQuantizer.quantize(hitchThis(this, function(linkID, action) {
    logger.log("reddit", "Making ajax unhide call");
    
    var params = {
      id:    linkID,
    };
    params = this.reddit.auth.authModHash(params);
    
    var act = http.PostAction(APIURL(this.reddit.auth.site, "unhide"), params);
    act.chainTo(action);
    act.perform();
  })));
}