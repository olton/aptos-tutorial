import isPortReachable from 'is-port-reachable';

console.log(await isPortReachable(6181, {host: '95.216.7.245'}));