const api = require('../helpers/api');
const {version} = require('../package.json');
const config = require('../helpers/configReader');

let address,
    publicKey;

if (config.isDev){
    address = config.address;
    publicKey = config.publicKey;
} else {
    const keys = require('adamant-api/helpers/keys');
    const AdmKeysPair = keys.createKeypairFromPassPhrase(config.passPhrase);
    address = keys.createAddressFromPublicKey(AdmKeysPair.publicKey);
    publicKey = AdmKeysPair.publicKey.toString('hex');
}

module.exports = {
    version,
    poolname: '',
    delegate: {
        address,
        publicKey,
        balance: 0,
        voters: []
    },
    async updateVotersList () {
        const resp = await api.get('uri', 'delegates/voters?publicKey=' + this.delegate.publicKey);
        if (resp && resp.success){
            this.delegate.voters = resp.accounts;
        }
    },
    async updateBalance () {
        const resp = await api.get('uri', 'accounts?publicKey=' + this.delegate.publicKey);
        if (resp && resp.success){
            this.delegate = Object.assign(this.delegate, resp.account);
            this.delegate.balance = +this.delegate.balance;
        }
    },

    async updateDelegate (isUpdateVoters){
        try {
            const resp = await api.get('uri', 'delegates/get?publicKey=' + this.delegate.publicKey);// TODO: fixed endpoint node
            if (resp && resp.success){
                this.delegate = Object.assign(this.delegate, resp.delegate);
                this.poolname = this.delegate.username;
                this.delegate.votesWeight = +this.delegate.votesWeight;
            }
            if (isUpdateVoters){
                await this.updateVotersList();
                await this.updateBalance();
            }
        } catch (e){}
    },
};

setInterval(()=>{
    module.exports.updateDelegate(true);
}, 60 * 1000);
