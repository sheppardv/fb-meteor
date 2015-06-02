Matches = new Mongo.Collection("matches");
currentMatch = Matches.findOne({
    ended_at: null
});

function Match(first_team_names, second_team_names, started_at) {
    return {
        first_team: first_team_names || ['', ''],
        second_team: second_team_names || ['', ''],
        started_at: started_at || null,
        ended_at: null
    };
}
function addNewMatch(first_team_names, second_team_names) {
    var newMatch = new Match(first_team_names, second_team_names, new Date());
    Matches.insert(newMatch);
    return newMatch;
}

UI.registerHelper('timeDiffInMin', function (started_at, ended_at) {
    return ( ( ended_at.getTime() - started_at.getTime() ) / (60 * 1000) ).toFixed(1);
});

UI.registerHelper('formatDate', function (date, doNotIncludeDays) {
    if (!date) {
        return 'N/A';
    }
    return doNotIncludeDays ?
        (date.getDay() + '-' + date.getMonth() + '-' + date.getFullYear() + ' ' + (date.getHours() + ':' + date.getMinutes())) :
        (date.getHours() + ':' + date.getMinutes());
});


if (Meteor.isClient) {


    var $counter = $('#counter');

    var counter = null;

    Template.match_history.helpers({
        matches: function () {
            return Matches.find({
                ended_at: {$ne: null}
            }, {sort: {ended_at:-1}});
        }
    });

    Template.current_match.helpers({
        match: function () {
            currentMatch = Matches.findOne({
                ended_at: null
            });
            if(currentMatch){
                counter = setInterval(function () {
                    var diffInSec = ( (new Date()).getTime() - currentMatch.started_at.getTime() ) / (1000);
                    $('#counter').html( diffInSec.toFixed()  + ' s');
                }, 500);
                console.log(counter);
            }

            return currentMatch || new Match();
        }
    });

    Template.match_history.events({});

    Template.current_match.events({
        'click #start': function () {
            var first_team_names = Array.prototype.map.call(document.getElementsByClassName('first_team'), function (el) {
                return el.value;
            });

            var second_team_names = Array.prototype.map.call(document.getElementsByClassName('second_team'), function (el) {
                return el.value;
            });

            currentMatch = addNewMatch(first_team_names, second_team_names);

            counter = setInterval(function () {
                $counter.html( ( (new Date()).getDate() - currentMatch ) / (60*1000) );
            }, 500)

        },
        'click #stop': function () {
            currentMatch = Matches.findOne({
                ended_at: null
            });

            Matches.update(currentMatch._id, {$set: {ended_at: new Date()}});
        }

    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
