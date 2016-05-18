export default
/*@ngInject*/
function aAuthModel($resource, ANALYTICS_API, SatellizerPopup, $window) {
  var resource = $resource(ANALYTICS_API + '/auth/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'authGoogle': {method: 'GET', params: { method: 'google' }},
    'authYandex': {method: 'GET', params: { method: 'yandex' }}
  });

  resource.signIn = (callback) => {
    callback = callback || angular.noop;

    resource.authGoogle(res => {
      var callbackUrl = '/auth/google/callback';

      var openPopup = SatellizerPopup.open(res.url, 'Google Auth', { width: 452, height: 633 }, $window.location.origin).pollPopup(callbackUrl);
      openPopup
      .then(function(token) {
          console.log('on data', token);
          // callback(token);
      })
      .catch(function(err) {
        console.log('error', err);
      })
      .finally(function(resp) {
        callback(true);
      });
    });
  };

  resource.yandexSignIn = (callback) => {
    callback = callback || angular.noop;

    resource.authYandex(res => {

      var openPopup = SatellizerPopup.open(res.url, 'Yandex Auth', { width: 452, height: 633 }, $window.location.origin).pollPopup();
      console.log(openPopup);
      openPopup.then(function(token) {
        callback(token);
      })
        .catch(function(err) {
          console.log(err);
        });
    });
  };

  return resource;
}
