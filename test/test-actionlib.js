// Copyright (c) 2017 Intel Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable camelcase */

'use strict';

const assert = require('assert');
const rclnodejs = require('../index.js');

describe('Testing message files generated from an action file', function() {

  this.timeout(60 * 1000);

  beforeEach(function() {
    return rclnodejs.init();    
  });

  afterEach(function() {
    rclnodejs.shutdown();
  });

  it('ActionServer start', function() {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes1',
      rclnodejs: rclnodejs
    });

    as.start();
  });

  it('GoalStatus requiring', function() {
    rclnodejs.require('actionlib_msgs/msg/GoalStatus');
  });

  it('ActionClient sendGoal', function() {
    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes3',
      rclnodejs: rclnodejs
    });

    ac.sendGoal({ goal: {dishwasher_id: 3}});
  });

  it('ActionLib server goal event triggered', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes4',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      clearInterval(timer);
      done();
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes4',
      rclnodejs: rclnodejs
    });
    ac.sendGoal({ goal: {dishwasher_id: 4}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 4}});
    }, 50);
  });

  it('ActionLib client feedback accepted', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes5',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      let feedback = {
        percent_complete: 70
      };

      goal.publishFeedback(feedback);
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes5',
      rclnodejs: rclnodejs
    });
    ac.on('feedback', function(feedback) {
      assert.strictEqual(feedback.percent_complete, 70);
      clearInterval(timer);
      done();
    });

    ac.sendGoal({ goal: {dishwasher_id: 5}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 5}});
    }, 50);
  });

  it('ActionLib server goal cancelled', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes6',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setCancelRequested();
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes6',
      rclnodejs: rclnodejs
    });
    ac.on('feedback', function(feedback) {
      assert.throws(() => {
        throw new Error('should not be here');
      }, Error);
    });
    ac.on('status', function(status) {
      clearInterval(timer);
      done();
    });

    ac.sendGoal({ goal: {dishwasher_id: 6}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 6}});
    }, 50);    
  });

  it('ActionLib server goal setCancelled', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes7',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      as.on('cancel', function(goalHandle) {
        goal.setCancelled({total_dishes_cleaned: 10}, 'canceled');
        clearInterval(timer);
        done();
      });
      ac.cancel(goal.id);
    });

    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes7',
      rclnodejs: rclnodejs
    });
    ac.sendGoal({ goal: {dishwasher_id: 7}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 7}});
    }, 50);
  });

  it('ActionLib server goal setRejected', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes8',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setRejected({total_dishes_cleaned: 0}, 'rejected');
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes8',
      rclnodejs: rclnodejs
    });

    let count = 0;
    ac.on('status', function(status) {
      if (count++ == 1) {
        assert.strictEqual(status.status_list[0].text, 'rejected');
        clearInterval(timer);
        done();
      }
    });
    ac.sendGoal({ goal: {dishwasher_id: 8}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 8}});
    }, 50);
  });

  it('ActionLib server goal setAborted', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes9',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      goal.setAborted({total_dishes_cleaned: 0}, 'aborted');
    });

    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes9',
      rclnodejs: rclnodejs
    });
    ac.on('result', function(result) {
      assert.strictEqual(result.total_dishes_cleaned, 0);
      clearInterval(timer);
      done();
    });
    ac.sendGoal({ goal: {dishwasher_id: 9}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 9}});
    }, 50); 
  });

  it('ActionLib sever goal setSucceeded', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes10',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      goal.setSucceeded({total_dishes_cleaned: 100}, 'done');
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes10',
      rclnodejs: rclnodejs
    });
    ac.on('result', function(result) {
      assert.strictEqual(result.total_dishes_cleaned, 100);
      clearInterval(timer);
      done();
    });

    ac.sendGoal({ goal: {dishwasher_id: 10}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 10}});
    }, 50);    
  });

  it('ActionLib complete process', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes11',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      let feedback = {
        percent_complete: 90
      };

      goal.publishFeedback(feedback);
      goal.setSucceeded({total_dishes_cleaned: 100}, 'done');
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes11',
      rclnodejs: rclnodejs
    });
    ac.on('feedback', function(feedback) {
      assert.strictEqual(feedback.percent_complete, 90);
    });
    ac.on('result', function(result) {
      assert.strictEqual(result.total_dishes_cleaned, 100);
      clearInterval(timer);
      done();
    });

    ac.sendGoal({ goal: {dishwasher_id: 11}});
    let timer = setInterval(() => {
      ac.sendGoal({ goal: {dishwasher_id: 11}});
    }, 50);
  });

  it('ActionClient cancel', function(done) {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes12',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      ac.cancel(gGoal.goal_id.id);
    });
    as.on('cancel', function(goalHandle) {
      clearInterval(timer); 
      done();
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes12',
      rclnodejs: rclnodejs
    });
    var gGoal = ac.sendGoal({ goal: {dishwasher_id: 12}});
    let timer = setInterval(() => {
      gGoal = ac.sendGoal({ goal: {dishwasher_id: 12}});
    }, 50);
  });

  it('ActionClient shutdown', function() {
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes13',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
    });
    as.start();

    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes13',
      rclnodejs: rclnodejs
    });
    ac.sendGoal({ goal: {dishwasher_id: 13}});
    ac.shutdown();
  });

  it('ActionClient status succeed', function(done) {
    const GoalStatus = rclnodejs.require('actionlib_msgs/msg/GoalStatus');
    let as = new rclnodejs.ActionLib.ActionServer({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes14',
      rclnodejs: rclnodejs
    });
    as.on('goal', function(goal) {
      goal.setAccepted('goal accepted');
      goal.setSucceeded({total_dishes_cleaned: 100}, 'done');
    });
    as.start();

    let count = 0;
    let ac = new rclnodejs.ActionClientInterface({
      type: 'ros1_actions/msg/DoDishes',
      actionServer: 'dishes14',
      rclnodejs: rclnodejs
    });
    ac.on('status', function(status) {
      status.status_list.forEach((s) =>{
        if (count++ == 1 && s.goal_id.id === goal.goal_id.id &&
            s.status === GoalStatus.SUCCEEDED) {
          clearInterval(timer);
          done();
        }
      });
    });

    var goal = ac.sendGoal({ goal: {dishwasher_id: 14}});
    let timer = setInterval(() => {
      goal = ac.sendGoal({ goal: {dishwasher_id: 14}});
    }, 50);
  });
});
