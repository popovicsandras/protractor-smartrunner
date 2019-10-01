import { PluginConfig } from 'protractor';

export class Lazyrun implements PluginConfig {
    onPrepare() {
        console.log('test started');
    }

    teardown() {
        console.log('test finished');
    }
}
