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

    'authGoogle': {method: 'GET', params: { method: 'google' }}
  });

  resource.signIn = (callback) => {
    callback = callback || angular.noop;

    resource.authGoogle(res => {
      var openPopup = SatellizerPopup.open(res.url, 'Google Auth', { width: 452, height: 633 }, $window.location.origin).pollPopup();

      openPopup.then(function(token) {
        callback(token);
      });
    });
  };

  return resource;
}
