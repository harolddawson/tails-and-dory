#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TailsAndDoryStack } from '../lib/tails-and-dory-stack';

const app = new cdk.App();

new TailsAndDoryStack(app, 'TailsAndDoryStack', {
  env: {
    account: '118842417822',
    region: 'us-east-1',
  },
});
