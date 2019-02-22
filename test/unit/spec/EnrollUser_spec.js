/* eslint max-params: [2, 13], max-len: [2, 160] */
define([
  'okta',
  '@okta/okta-auth-js/jquery',
  'util/Util',
  'helpers/mocks/Util',
  'helpers/dom/EnrollUserForm',
  'helpers/util/Expect',
  'LoginRouter',
  'sandbox',
  'helpers/xhr/PROFILE_REQUIRED_UPDATE',
  'helpers/xhr/PROFILE_REQUIRED_NEW',
  'helpers/xhr/SUCCESS',
  'helpers/xhr/UNAUTHENTICATED_IDX'
],
function (Okta, OktaAuth, LoginUtil, Util, EnrollUserForm, Expect, Router,
  $sandbox, resProfileRequiredUpdate, resProfileRequiredNew, resSuccess, resUnauthenticatedIdx) {

  var { _, $, Backbone } = Okta;
  var itp = Expect.itp;

  function setup (settings, resUnauthenticatedIdx) {
    settings || (settings = {});
    var successSpy = jasmine.createSpy('successSpy');
    var setNextResponse = Util.mockAjax();
    var baseUrl = 'https://example.okta.com';
    var logoUrl = 'https://logo.com';
    var authClient = new OktaAuth({ url: baseUrl, transformErrorXHR: LoginUtil.transformErrorXHR });
    var router = new Router(_.extend({
      el: $sandbox,
      baseUrl: baseUrl,
      features: { consent: true },
      logo: logoUrl,
      authClient: authClient,
      globalSuccessFn: successSpy
    }, settings));
    Util.registerRouter(router);
    Util.mockRouterNavigate(router);
    Util.mockJqueryCss();

    router.refreshAuthState('dummy-token');
    settings = {
      router: router,
      successSpy: successSpy,
      form: new EnrollUserForm($sandbox),
      ac: authClient,
      setNextResponse: setNextResponse
    };
    if (resUnauthenticatedIdx) {
      setNextResponse(resUnauthenticatedIdx);
      return Expect.waitForPrimaryAuth(settings);
    } else {
      setNextResponse(resProfileRequiredUpdate);
      return Expect.waitForEnrollUser(settings);
    }
  }

  Expect.describe('Enroll User', function () {
    Expect.describe('Enroll User Form', function () {
      itp('has the correct title on the enroll form', function () {
        return setup().then(function (test) {
          expect(test.form.formTitle().text()).toContain('Create Account');
        });
      });
      itp('has the correct title on the register button', function () {
        return setup().then(function (test) {
          expect(test.form.formButton()[0].value).toEqual('Register');
        });
      });
      itp('does not allow empty form submit', function () {
        return setup().then(function (test) {
          test.form.formButton().click();
          expect(test.form.errorMessage()).toEqual('We found some errors. Please review the form and make corrections.');
          
        });
      });
      itp('renders the right fields based on API response', function () {
        return setup().then(function (test) {
          expect(test.form.formInputs('streetAddress').length).toEqual(1);
          expect(test.form.formInputs('streetAddress').hasClass('okta-form-input-field input-fix')).toBe(true);

          expect(test.form.formInputs('employeeId').length).toEqual(1);
          expect(test.form.formInputs('employeeId').hasClass('okta-form-input-field input-fix')).toBe(true);
        });
      });

      itp('makes call to enroll if isEnrollWithLoginIntent is true and then renders the right fields based on API response', function () {
        return setup(null, resUnauthenticatedIdx).then(function (test) {
          test.setNextResponse(resProfileRequiredNew);
          test.form.$('.registration-link').click();
          return Expect.waitForEnrollUser(test);
        })
          .then(function (test) {
            expect(test.form.formInputs('streetAddress').length).toEqual(1);
            expect(test.form.formInputs('streetAddress').hasClass('okta-form-input-field input-fix')).toBe(true);
            expect(test.form.formInputs('employeeId').length).toEqual(1);
            expect(test.form.formInputs('employeeId').hasClass('okta-form-input-field input-fix')).toBe(true);
            return Expect.waitForEnrollUser(test);
          })
          .then(function (test) {
            $.ajax.calls.reset();
            test.setNextResponse(resSuccess);
            var model = test.router.controller.model;
            model.set('streetAddress', 'street address');
            model.set('employeeId', '1234');
            spyOn(Backbone.Model.prototype, 'save').and.returnValue($.Deferred().resolve());
            model.save();
            return Expect.waitForEnrollUser(test);
          })
          .then(function () {
            expect($.ajax.calls.count()).toBe(1);
            Expect.isJsonPost($.ajax.calls.argsFor(0), {
              url: 'https://foo.okta.com/api/v1/authn/enroll',
              data: {
                'registration': {
                  'createNewAccount': true,
                  'profile': {
                    'streetAddress': 'street address',
                    'employeeId': '1234'
                  }
                },
                'stateToken': '01StateToken'
              }
            });
          });
      });

      itp('enroll user form submit makes the correct post call', function () {
        return setup().then(function (test) {
          $.ajax.calls.reset();
          test.setNextResponse(resSuccess);
          var model = test.router.controller.model;
          model.set('streetAddress', 'street address');
          model.set('employeeId', '1234');
          spyOn(Backbone.Model.prototype, 'save').and.returnValue($.Deferred().resolve());
          model.save();
          return Expect.waitForEnrollUser(test);
        })
          .then(function () {
            expect($.ajax.calls.count()).toBe(1);
            Expect.isJsonPost($.ajax.calls.argsFor(0), {
              url: 'http://foo.okta.com:1802/api/v1/authn/enroll',
              data: {
                'registration': {
                  'profile': {
                    'streetAddress': 'street address',
                    'employeeId': '1234'
                  }
                },
                'stateToken': '01nDL4wRHu-dLvUHUj1QCA9r5P1n5dw6WJ_voGPFWB'
              }
            });
          });
      });
    });
  });

});
