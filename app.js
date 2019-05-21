const {
    TIME_RATE,
    SAT
} = require('./helpers/const');
const config = require('./helpers/configReader');
const rewardUsers = require('./helpers/rewardUsers');
const adamant = require('./helpers/api');
const log = require('./helpers/log');
const notifier = require('./helpers/slackNotifier');
let lastForg = unixTime();

// Init
require('./helpers/cron');
require('./server');
const delegate = adamant.get('full_account', config.address);
const poolname = delegate.delegate.username;
let delegateForged = +delegate.delegate.forged;

log.info('ADAMANT-pool started ' + poolname + ' (' + config.address + ').');

iterat();

function iterat () {
    setTimeout(() => {
        try {
            const newForged = +adamant.get('delegate_forged', delegate.publicKey).forged;
            if (isNaN(newForged)) {
                const msg = `Pool ${poolname} newForged value isNaN! Check internet connection.`;
                notifier(msg, 'red');
                log.error(msg);
                return;
            }
            if (delegateForged < newForged) {
                lastForg = unixTime();
                const forged = newForged - delegateForged;
                log.info('newForged: ' + forged / SAT + ' ADM.');
                const resRewards = rewardUsers(forged, delegateForged);
                if (resRewards) {
                    delegateForged = newForged;
                }
            }

        } catch (e) {
            log.error('Cannot get newForged!');
        }

        iterat();
    }, TIME_RATE * 1000);
}

// refresh dbVoters if no forged
setTimeout(() => {
    rewardUsers(0);
}, 5000);

setInterval(() => {
    if (unixTime() - lastForg > 600) {
        rewardUsers(0);
    }
}, 600 * 1000);

function unixTime () {
    return new Date().getTime() / 1000;
}
