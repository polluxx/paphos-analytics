export default
/*@ngInject*/
function aPageModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/pages/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'}
  });

  return resource;
}
