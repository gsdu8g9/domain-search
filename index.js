#!/usr/bin/env node

const fs = require('fs')
const xmlrpc = require('xmlrpc')
const readline = require('readline')

const keyFilename = 'key.txt'
const domainsFilename = 'domains.txt'

const api = xmlrpc.createSecureClient({
  host: 'rpc.gandi.net',
  port: 443,
  path: '/xmlrpc/'
 })
const apikey = fs.readFileSync(keyFilename, 'utf8').trim();
const linereader = readline.createInterface({
  input: fs.createReadStream(domainsFilename)
})

function checkIfDomainIsAvailable(domain) {
  return new Promise((resolve, reject) => {
    const retries = 3
    let retryCount = 0

    const apiCallback = (error, value) => {
      if (!value || !value[domain]) {
        reject('The domain was not found in the API response')
      } else if (value[domain] === 'pending') {
        if (retryCount++ > retries) {
          reject('API retries maxed out')
        }
        setTimeout(() => {
          api.methodCall('domain.available', [apikey, [domain]], apiCallback)
        }, 500)
      } else {
        resolve(value[domain] === 'available')
      }
    }

    api.methodCall('domain.available', [apikey, [domain]], apiCallback)
  });
}

linereader.on('line', function (line) {
  if (line.split('.')[0].length >= 2) {
    checkIfDomainIsAvailable(line).then((isAvailable) => {
      if (isAvailable) {
        console.log(line)
      }
    }).catch()
  }
})
