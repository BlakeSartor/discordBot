const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const ud = require('urban-dictionary');

const client = new Discord.Client();

client.once('ready', () => {
    console.log('ready')
})

client.on('message', message => {


    

    if (message.author.username !== 'Garglemoore') {
        randNum = Math.floor(Math.random() * 100) + 1  
        console.log(randNum)

        if (randNum >= 80) {
        let wordArray = message.content.split(" ");
        let randWord = wordArray[Math.floor(Math.random()*wordArray.length)]
        // message.channel.send("First, we must define " + randWord + ".");

        if (randWord === 'garglemoore') {
            message.channel.send("First, we must define " + randWord + ".");

            message.channel.send("According to my sources...")
            message.channel.send("Garglemoore")
            message.channel.send("A mythicial creature capable of gargling semen at intense volumes.")
            return;
        }

        if (randWord === 'phil') {
            message.channel.send("First, we must define " + randWord + ".");

            message.channel.send("According to my sources...")
            message.channel.send("Phil is a real piece of shit")
            return;
        }

        if (randWord !== 'and' && randWord !== 'the' && randWord !== 'or' && randWord !== 'to' && randWord !== 'a') {
            message.channel.send("First, we must define " + randWord + ".");

        ud.term(randWord).then((result) => {
            const entries = result.entries
            console.log(entries[0].word)
            console.log(entries[0].definition)
            console.log(entries[0].example)
            message.channel.send("According to my sources...")
            message.channel.send(entries[0].word)
            message.channel.send(entries[0].definition)
            message.channel.send(entries[0].example)
          }).catch((error) => {
            console.error(error.message)
            message.channel.send(error.message);
          })
        }
    }
    }

})

// client.on('voiceStateUpdate', (oldMember, newMember)=> {
//     let newUserChannel = newMember.voiceChannel;
//     let oldUserChannel = oldMember.voiceChannel;

//     if (oldUserChannel === undefined && newUserChannel !== undefined) {
//         // jOIN
//         // console.log(author.username + " has joined the voice chat.");
//     }

//     else if (newUserChannel === undefined) {
//         console.log(newMember + " just rage quit.");

//     }
// })

client.login(token);

