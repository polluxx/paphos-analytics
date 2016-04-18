export default
/*@ngInject*/
function aVisitModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/visits/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'getGrownUp': {method: 'GET', params: { method: 'grown-up' }, isArray: true},
    'getDropIn': {method: 'GET', params: { method: 'drop-in' }, isArray: true}
  });

  return resource;
}
