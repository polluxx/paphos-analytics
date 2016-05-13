export default
/*@ngInject*/
function aPageModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/pages/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},
    'refresh': {method: 'GET', params: {method: 'refresh' }, isArray: false},
    'keywords': {method: 'GET', params: {method: 'keywords'}, isArray: true},
    'sendTask': {method: 'GET', params: {method: 'task' }, isArray: false}
  });

  return resource;
}
