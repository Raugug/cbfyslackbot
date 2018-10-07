require('dotenv').config()
const SlackBot = require('slackbots');
const ontime = require('ontime');
//const User = require('./models/User')
//const Leaders = require('./models/Leaders')

//// HELPER ////
const showList = (a) => {
    let showMode = a.map(e=>` <@${e}>`)
    return showMode;
}

//////// BOT ////////
let bot = new SlackBot({
    token: process.env.TOKEN,
    name: 'gordify'
});

//// FAKE TEST DATA ////
let people = [];
let numOfPeople = Math.floor(Math.random() * (25 - 5) + 5);
for (let i=1; i<=numOfPeople; i++){
    people.push(i)
}
console.log(numOfPeople+' people')
let lastWeekLeaders = [8,7,6,5,4,3,2,1]
////////

//// START ////
ontime({
    cycle: ['Sun 23:07:00']
}, (ot) => {
    console.log("START")
    bot.login()
    bot._events = bot.evs;
    //bot.emit('start')

    // START EVENTS //
    bot.on('start', () => {
        bot.postMessage('general','Ey! who is going to have lunch out today, fellas?');
    });

    bot.on('message', data => {
        if (data.type !== 'message') {
            return
        }
        mssgReader(data.text, data.user, data.channel)
    })
    ot.done()
    return
})



//// RECEIVING MESSAGES ////

const mssgReader = (message, user, channel) => {
    if (message.includes('lunch yes')) {
        if (people.indexOf(user) === -1) {people.push(user)}
        numOfPeople = people.length;
        let res = `You're in, <@${user}>!`;
        bot.postMessage(channel, res)
    }
    if (message.includes('lunch no')) {
        if (people.indexOf(user) !== -1) {
            let index = people.indexOf(user)
            people.splice(index, 1)
            numOfPeople = people.length;
        }
        let res = ` You're out, <@${user}>!`;
        bot.postMessage(channel, res)
    }
    if (message.includes('lunch list')) {
        let res = `People to lunch: ${showList(people)}`;
        bot.postMessage(channel, res)
    }
}


//// GROUPS FORMATION ////

const groupsize  = (num) => {
    if (num%7 == 0) return [num/7, 0, 7];
    for(let i=6; i>0; i--){
      if (num%i == 0) return [Math.floor(num/i), num%i, i]
      else {
        for (let j=1; j<i; j++){
          if(num%i == i-j && num%i < num/i)return [Math.floor(num/i), num%i, i]
        }
      }
    }
}

const groups = (a) => {
    console.log("CONFIGURATION: ")
    if (a[1]==0) console.log(a[0]+' groups of '+a[2])
    else console.log(a[0]+' groups; '+a[1]+' of '+(a[2]+1)+' and '+(a[0]-a[1])+' of '+a[2])
}
  
  
const shuffle = (a) => {
    a.sort(() => { return Math.random() - (0.5)})
    return a;
}

const distribution = (people, gConf) => {
    let groups = [];
    for (let i=0; i<gConf[0]; i++){
      groups[i] = []
    }
    let i = 0;
    while (people.length >0){
        let person = people.pop();
        groups[i].push(person);
        i++;
        if (i==(gConf[0])) i=0;
    }
    return groups;
}

const getLeaders = (groups) => {
    let leaders = []
    groups.forEach(e => {
      let leader = e[0];
      for (let i=0; i<e.length-1; i++) {
        if (lastWeekLeaders.includes(leader)) {leader = e[i+1]}
      }
      leaders.push(leader)
    })
    return leaders;
}

//// STOP ////

ontime({
    cycle: ['Sun 23:07:20']
}, (ot) => {
    console.log("STOP")

    // ENDTIME EVENT //
    bot.on('endtime', () => {
        console.log('LAST WEEK LEADERS: '+ lastWeekLeaders)
    
        let gConfig = groupsize(numOfPeople)
        groups(gConfig)
        let randomPeople = shuffle(people)
        let weekGroups = distribution (randomPeople, gConfig)
        let weekLeaders = getLeaders(weekGroups);
    
        weekGroups.forEach((e, i) =>{
            console.log("GROUP:", e)
            console.log("LEADER:", weekLeaders[i])
        })
        let message = '';
    
        weekGroups.forEach((e, i) =>{
            message += `Group ${i+1}: ${showList(e)}`
            message += `\nLeader: <@${weekLeaders[i]}>\n`
        })
        bot.postMessage('general', 'Time to lunch. today we have the following groups:');
        bot.postMessage('general', message);
        lastWeekLeaders = weekLeaders;
        console.log('WEEK LEADERS UPDATED: '+ lastWeekLeaders)
    
    })
    bot.emit('endtime')
    bot._events = {};
    ot.done()
    return
})