import { ProtractorPlugin } from 'protractor';

const lazyrun: ProtractorPlugin = {
    onPrepare() {
        console.log('test started');
    },

    teardown() {
        console.log('test finished');
    },

    addSuccess(info: {specName: string}) {
      console.log('on success: ' + info.specName);
    }
};

module.exports = lazyrun;

