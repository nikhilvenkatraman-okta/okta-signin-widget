/*!
 * Copyright (c) 2019, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
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
  'models/EnrollUser',
  'util/BaseLoginController',
  'views/enrollUser/EnrollUserForm',
  'views/enrollUser/Footer',
],
function (
  Okta,
  EnrollUser,
  BaseLoginController,
  EnrollUserForm,
  Footer,
) {

  return BaseLoginController.extend({
    className: 'enroll-user',
    initialize: function (options) {
      this.options = options || {};
      // create model
      this.model = new EnrollUser(this.options);
      
      // create form
      var form = new EnrollUserForm(this.toJSON());
      // add form
      this.add(form);
      // add footer
      this.add(new Footer(this.toJSON()));
      this.addListeners();
    }
  });
});