const Discord = require('discord.js');
const {prefix, token, youtubeKey, nomicsKey, alphaVantageKey} = require('./config.json');
const ud = require('urban-dictionary');
const fetch = require("node-fetch");
const ytdl = require('ytdl-core');
const glamorous = require("./glam.json")

const client = new Discord.Client();

const queue = new Map();

const playList = []

client.login(token);

client.once('ready', () => {
    console.log('ready')
})

client.on('message', async message => {

    if (message.author.username !== 'Garglemoore') {

        if ((message.content.substring(0,1) == '/') || (message.content.substring(0,1) == '!')) {

            const serverQueue = queue.get(message.guild.id);

            var args = message.content.substring(1).split(' ');
            var cmd = args[0];

            args = args.splice(1);
            switch(cmd) {
                case 'glam':
                    execute(message, serverQueue, glamorous);
                    break;
                case 'random':
                    randomPlayer(message)
                    break;
                case 'play':
                    execute(message, serverQueue, null);
                    message.delete();
                    break;
                case 'skip':
                    skip(message, serverQueue);
                    message.delete();
                    break;
                case 'stop':
                    stop(message, serverQueue);
                    message.delete();
                    break;
                case 'help':
                    message.channel.send("```/define\n/youtube\n/roll\n/help```");
                    break;
                case 'define':
                    defineWord(args, message);
                    break;
                case 'roll':
                    randomRoll(args, message);
                    break;
                case 'youtube':
                    search(args, message);
                    break;
                case 's':
                    stockTicker(args, message)
                    break;
                default:
                    cryptoTicker(cmd, message)
                    break;
            }
        }
    }
})

function randomPlayer(message) {

    const vs = message.member.voice.channel
    var someList = []
    var members = vs.members
    members.forEach(element => {
        someList.push(element.user.username)
    });

    someList = someList.filter(e => e !== 'Garglemoore');
    var rollCount = someList.length;

    var numberOfSides = 100
    var rolls = 0;
    var randList = [];
    while (rolls < rollCount) {
        var rand = Math.floor(Math.random() * numberOfSides) + 1;
        randList.push(someList[rolls] + " rolled a [" + rand + "]\n");
        rolls++;
    }
    var stringy = "```begins rolling a " + numberOfSides + " sided dice... \n" + randList.toString() + "```"
    var newOne = stringy.replace(/,/g,"")
    message.channel.send(newOne);
}

function sendAndDissolve(string, message) {
    if (message.channel.name != 'garglemoore') {
        message.channel.send(string)
        .then(msg => {
            msg.delete({ timeout : 10000})
            message.delete({timeout: 10000});
            return;
    
        })
        .catch(err => {
            console.log(err)
        });
    }
    else {
        message.channel.send(string)
    }
}

async function execute(message, serverQueue, songObject) {

    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "```You need to be in a voice channel to play music!```"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "```I need the permissions to join and speak in your voice channel!```"
      );
    }
    var song = {};
    if (songObject == null) {
        const songInfo = await ytdl.getInfo(args[1]);
        song = {
              title: songInfo.videoDetails.title,
              url: songInfo.videoDetails.video_url,
         };
    } else {
        song = songObject;
    }

    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send("```CSS\n[" + song.title + "] has been added to the queue!```");
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "```You have to be in a voice channel to stop the music!```"
      );
    if (!serverQueue)
      return message.channel.send("```There is no song that I could skip!```");
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "```You have to be in a voice channel to stop the music!```"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  try {
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url, {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", (error) => {
          console.error(error);
          serverQueue.textChannel.send("```I have encountered an error. pls dont me mad.```");
          return;
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 14);
    serverQueue.textChannel.send("```CSS\nNow playing: [" + song.title + "]```");
    } catch (e) {
        console.log(e);
        serverQueue.textChannel.send("```I have encountered an error. pls dont me mad.```");
    }
  }

function defineWord(args, message) {
    var word = args.join();
    ud.term(word).then((result) => {
        const entries = result.entries;
        console.log(entries[0].word);
        console.log(entries[0].definition);
        console.log(entries[0].example);
        message.channel.send("```" + entries[0].definition + "\n" +  entries[0].example + "```");
      }).catch((error) => {
        console.error(error.message);
        message.channel.send("```looks at you with a blank stare```");
    })
}

function randomRoll(args, message) {
    var rollCount;
    var numberOfSides = parseInt(args[0]);
    console.log(numberOfSides);
    if (isNaN(numberOfSides) || numberOfSides <= 0) {
        message.channel.send("```looks at you with a blank stare```");
        return;
    }
    var parsedCount = parseInt(args[1]);

    if (parsedCount == null || isNaN(parsedCount) || parsedCount < 2 || parsedCount > 10) {
        rollCount = 1;
    }
    else {
        rollCount = parsedCount;
    }

    var rolls = 0;
    var randList = [];
    while (rolls < rollCount) {
        var rand = Math.floor(Math.random() * numberOfSides) + 1;
        randList.push("[" + rand + "]");
        rolls++;
    }
    if (randList.length > 1) {
        message.channel.send("```begins rolling a " + numberOfSides + " sided dice... \n" + randList + "```");

    }
    else {
        message.channel.send("```begins rolling a " + numberOfSides + " sided dice " + rollCount + " times... \n" + randList + "```");

    }
}

function cryptoTicker(args, message) {
  var crypto = args.toUpperCase();  
  var url = "https://api.nomics.com/v1/currencies/ticker?key=" + nomicsKey +"&ids=" + crypto + "&interval=1d,7d,30d";
  
  fetch(url)
  .then(response => response.json())
  .then(data => {
      console.log(data);
      console.log(data.length);

      if(parseInt(data.length) == 0){ //WHY THIS NO WORK?!?! -- FIXED -- WOW, crazy! So if data.status is "undefined" the code hangs there. So first check if undefined, then check if dead/inactive, then produce results. WOWOWOWOOWW
        invalidCommand(args, message);
      }
      else if(data[0].status == "dead" || data[0].status == "inactive"){
        args = args.toUpperCase() + " is DEAD/INACTIVE or";
        invalidCommand(args, message);
      }
      
      else{
      var name = data[0].name;
      var price = parseFloat(data[0].price);
      var oneDayDelta = data[0]['1d'].price_change_pct*100;
      var sevenDayDelta = data[0]['7d'].price_change_pct*100;
      var thirtyDayDelta = data[0]['30d'].price_change_pct*100;
      var allTimeHigh = parseFloat(data[0].high);
      var allTimeHighDate = data[0].high_timestamp; // maybe change format to MM-DD-YY???

      // add if/else to colorize the text; if positive green text, else red text?? 
      // make the price rounding into a function?
      // check if valid crypto ticker -- otherwise run as a stock?
      
      if(price>1){
        price = price.toFixed(2);
        message.channel.send("```" + name + " = " + price + " USD: 1D=" + oneDayDelta.toFixed(2) + "%, 7D=" + sevenDayDelta.toFixed(2) + "%, 30D=" + thirtyDayDelta.toFixed(2) + "%, ATH=$" + allTimeHigh.toFixed(2) + "|" + allTimeHighDate.split("T")[0] + "```");
         
      }
      else{
        var priceRounded = price.toFixed(1-Math.floor(Math.log(Math.abs(price))/Math.log(10)));
        message.channel.send("```" + name + " = " + priceRounded + " USD: 1D=" + oneDayDelta.toFixed(2) + "%, 7D=" + sevenDayDelta.toFixed(2) + "%, 30D=" + thirtyDayDelta.toFixed(2) + "%, ATH=$" + allTimeHigh.toFixed(2) + "|" + allTimeHighDate.split("T")[0] + "```");
      }
      }
  });
}

function invalidCommand(args, message){
  sendAndDissolve("```im still learning, " + args + " is not a command. Use /help to find a list of commands.```", message);
  message.delete({timeout: 10000});
}

function stockTicker(args, message){
  var ticker = args.toUpperCase();
  var url = "https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + ticker + "&apikey=" + alphaVantageKey;


  fetch(url)
  .then(response => response.json())
  .then(response => {
      console.log(response)
      message.channel.send("this works?");


    });
  }
  


function search(args, message) {
    var searchPhrase = args.join();
    if (searchPhrase != null) {

    var url = "https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=";
    var baseUrl = "https://www.youtube.com/watch?v=";

    url = url + searchPhrase + "&key=" + youtubeKey + "&fields=items(id(videoId))&part=id";

    console.log(url);

    const fetchPromise = fetch(url);
        fetchPromise.then(response => {
        return response.json();
        }).then(myJson => {
            console.log(myJson);
            const id = myJson.items.map(element => element.id);
            if (id == null || myJson.items.length == 0) {
                message.channel.send("```looks at you with a blank stare```");
            }
            id.forEach(ele => {
                console.log(baseUrl + ele.videoId);
                console.log(ele.videoId);
                if (ele.videoId != null) {
                    message.channel.send(baseUrl + ele.videoId);
                }
                else {
                    message.channel.send("```looks at you with a blank stare```");
                }
            });
        }); 
    }
}
