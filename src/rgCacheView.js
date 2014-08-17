angular.module('rgCacheView', [])

.directive('rgCacheView', function ($cacheFactory, $rgScopeUtils) {
	return {
		restrict: "E",
		priority: 10000,
		transclude: true,
		compile: function(element, attrs, transcludeFn){
			var childScope;
			var cacheView = $cacheFactory.get('rgCacheView');
			if(!cacheView) cacheView = $cacheFactory('rgCacheView');
			var cacheName = attrs.name;
			var cache = cacheView.get(cacheName);
			return function(scope, element, attrs){
				if(cache){
					childScope = cache.scope;
					childScope.$broadcast('$outCacheStart', childScope);
					$rgScopeUtils.add(childScope, scope);
					element.append(cache.element.contents());
					childScope.$broadcast('$outCacheEnd', childScope);
				}else{
					childScope = scope.$new();
					transcludeFn(childScope, function(clone){
						element.append(clone);
					})
				}
				scope.$on('$destroy', function(e){
					childScope.$broadcast('$inCacheStart', childScope);
					$rgScopeUtils.remove(childScope);
				})
				element.on('$destroy', function(e){
					cacheView.put(cacheName, {
						element: angular.element('<div></div>').append(element.contents()),
						scope: childScope
					})
					childScope.$broadcast('$inCacheEnd', childScope);
				})
			}
		}
	}
})


.factory('$rgScopeUtils', [function() {
	var rgScopeUtils = {
		add: function(scope, parent){
			scope.$parent = parent;
			scope.$$prevSibling = parent.$$childTail;
			if(scope.$$prevSibling) scope.$$prevSibling.$$nextSibling = scope;
			
			parent.$$childTail = scope;
			if(!parent.$$childHead) parent.$$childHead = scope;
			
			scope.__proto__ = parent;
			
			return scope;
		},
		remove: function(scope){
			if(scope.$$prevSibling){
				scope.$$prevSibling.$$nextSibling = scope.$$nextSibling;
				scope.$$prevSibling = null;
			}else{
				scope.$parent.$$childHead = null;
			}
			
			if(scope.$$nextSibling){
				scope.$$nextSibling.$$prevSibling = scope.$$prevSibling;
				scope.$$nextSibling = null;
			}else{
				scope.$parent.$$childTail = null;
			}
			if(scope.$parent.$$childHead && !scope.$parent.$$childTail) scope.$parent.$$childTail = scope.$parent.$$childHead;
			if(!scope.$parent.$$childHead && scope.$parent.$$childTail) scope.$parent.$$childHead = scope.$parent.$$childTail;
			
			scope.$parent = null;
			return scope;
		}
	}
	
	return rgScopeUtils;
}]);
