const {TIME_RATE, SAT} = require('./helpers/const');
const config = require('./helpers/configReader');
const rewardUsers = require('./helpers/rewardUsers');
const adamant = require('./helpers/api');
const log = require('./helpers/log');
const notifier = require('./helpers/slackNotifier');
const pkg = require('./package.json');

let lastForg = unixTime,
    delegateForged,
    poolname,
    delegate;
// Init
setTimeout(async () => {
    require('./helpers/cron');
    require('./server');
    delegate = await adamant.get('full_account', config.address);
    poolname = delegate.delegate.username;
    delegateForged = +delegate.delegate.forged;

    notifier(`Pool ${poolname} started for address _${config.address}_ (ver. ${pkg.version}).`, 'info');
    iterat();
}, 3000);

function iterat () {
    setTimeout(async () => {
        try {
            const newForged = + (await adamant.get('delegate_forged', delegate.publicKey)).forged;
            if (isNaN(newForged)) {
                const msg = `Pool ${poolname} _newForged_ value _isNaN_! Please check Internet connection.`;
                notifier(msg, 'error');
                log.error(msg);
                iterat();
                return;
            }
            if (delegateForged < newForged) {
                lastForg = unixTime();
                const forged = newForged - delegateForged;
                log.info('New Forged: ' + forged / SAT + ' ADM.');
                const resRewards = rewardUsers(forged, delegateForged);
                if (resRewards) {
                    delegateForged = newForged;
                }
            }

        } catch (e) {
            log.error('Get new Forged!');
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
