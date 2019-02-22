/*!
 * Copyright (c) 2019, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the 'License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

define([
  'okta',
  'models/ProfileSchema',
  './BaseLoginModel'
],
function (Okta, ProfileSchema, BaseLoginModel) {
  var {_} = Okta;

  return BaseLoginModel.extend({
    props: this.properties,
    initialize: function (options) {
      this.options = options || {};
      this.appState = this.options.appState;
    },
    constructPostData: function (profileAttributes) {
      var postData = {
        'registration': {
          'profile': profileAttributes
        }
      };
      // send createNewAccount flag for new user creation
      if (this.createNewAccount) {
        postData.registration['createNewAccount'] = true;
      }
      return postData;
    },
    setUpSchema: function () {
      // setup schema
      var Schema = ProfileSchema.extend({
        settings: this.options.settings,
        appState: this.options.appState
      });
      this.schema = new Schema();
      // schema used in enrollUserForm
      this.options.appState.set('schema', this.schema);
      this.properties = this.schema.properties.createModelProperties();
      this.createNewAccount = this.appState.get('profileSchema')._embedded.policy.registration.createNewAccount;
    },
    getEnrollFormData: function () {
      return this.manageTransaction(function (transaction) {
        return transaction.enroll();
      });
    },
    save: function () {
      var data = Okta.Model.prototype.toJSON.apply(this, arguments);
      data = _.omit(data, ['appState', 'settings']);
      if (_.isEmpty(data)) {
        var error = {
          'errorSummary': Okta.loc('oform.errorbanner.title', 'login')
        };
        this.trigger('error', this, {
          responseJSON: error
        });
      } else {
        return this.manageTransaction(function (transaction, setTransaction) {
          transaction.enroll(this.constructPostData(data)).then(function (trans) {
            setTransaction(trans);
          });
        });
      }
    }
  });
});