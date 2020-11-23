const Discord = require('discord.js');
const {prefix, token, youtubeKey} = require('./config.json');
const ud = require('urban-dictionary');
const fetch = require("node-fetch");
const ytdl = require('ytdl-core');

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
                case 'playlist':
                    playlist(message);
                    break;
                case 'showlist':
                    showList(message);
                    break;
                case 'list':
                    addToPlayList(args, message);
                    break;
                case 'play':
                    execute(message, serverQueue);
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
                default:
                    sendAndDissolve("```im still learning, " + cmd + " is not a command. Use /help to find a list of commands.```", message)
                    break;
            }
        }
    }
})



function showList(message) {
    sendAndDissolve("```" + playList + "```", message)
}

async function playlist(message) {

    playList.forEach(element => {
        // console.log("executing on " + element);
        someFunction(message, serverQueue, element);
    })
}


async function someFunction(message, serverQueue, element) {

    console.log("ok here"  + element);
  
  
    // const songInfo = await ytdl.getInfo(songItem);
    // const song = {
    //       title: songInfo.videoDetails.title,
    //       url: songInfo.videoDetails.video_url,
    //  };
  
    // if (!serverQueue) {
    //   const queueContruct = {
    //     textChannel: message.channel,
    //     voiceChannel: voiceChannel,
    //     connection: null,
    //     songs: [],
    //     volume: 5,
    //     playing: true
    //   };
  
    //   queue.set(message.guild.id, queueContruct);
  
    //   queueContruct.songs.push(song);
  
    //   try {
    //     var connection = await voiceChannel.join();
    //     queueContruct.connection = connection;
    //     play(message.guild, queueContruct.songs[0]);
    //   } catch (err) {
    //     console.log(err);
    //     queue.delete(message.guild.id);
    //     return message.channel.send(err);
    //   }
    // } else {
    //   serverQueue.songs.push(song);
    //   return message.channel.send("```CSS\n[" + song.title + "] has been added to the queue!```");
    // }
  }

function addToPlayList(args, message) {
    sendAndDissolve("```" + args[0] + " added to owens plaything```", message)
    playList.push(args[0])
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

async function execute(message, serverQueue) {
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
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
     };
  
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