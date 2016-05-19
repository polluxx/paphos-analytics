export default
  /*@ngInject*/
  function($scope, aAuthModel, aTempSiteModel, aSiteModel, $timeout) {

    $scope.signIn = () => {
      aAuthModel.signIn((resp) => {
        $timeout($scope.getTempSites, 1500);
      });
    };

    $scope.checked = [];

    $scope.saveItem = () => {
      var sitesToSave = $scope.sites.filter((site) => {
        return site.$checked;
      });
      if(!sitesToSave.length) return;

      $scope.loading = true;
      var savedSites = [];
      sitesToSave.forEach((site) => {
        var savedItem = new aSiteModel(site);
        if (!savedItem['siteUrl']) return;

        savedItem.services = {};
        savedItem.tokens = savedItem.tokens;
        savedItem.services.analytics = true;
        savedItem.isActive = true;

        delete savedItem.token;
        delete savedItem._id;
        delete savedItem.$checked;

        console.log(site);
        aSiteModel.query({siteUrl: savedItem.siteUrl, page: 1, perPage: 1}, (res) => {

          if(!res.length) {
            var saved = savedItem.$create((res, err) => {
              aSiteModel.refresh({_id: res._id});
              $scope.$close();
            }, () => {
              $scope.loading = false;
              $scope.tableParams.reload();
            });
            savedSites.push(saved);
          } else {
            aSiteModel.refresh({_id: res._id});
          }

          aSiteModel.deleteTemp({_id: site._id});
        });
      });

      Promise.all(savedSites)
        .then((resp) => {
          //$scope.$close();

          console.log('all save', resp);
        }, () => {
          // $scope.loading = false;
          // $scope.tableParams.reload();
        })
        .catch(function(err) {
          console.log('all save', err);
        });

    }

    $scope.getTempSites = function() {
      aTempSiteModel.query({page: 1, perPage: 100}, function (sites) {
        console.log(sites);
        $scope.sites = sites;
      });
    }

    $scope.check = (_id) => {
      var index = $scope.checked.indexOf(_id);
      if(index === -1) {
        $scope.checked.push(_id);
      } else {
        $scope.checked.splice(index, 1);
      }
    }

    $scope.getTempSites();

  }