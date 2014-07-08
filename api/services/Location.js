var Location = function(location){
  this.location = location;
  this.data = location.split('\/');
}

Location.prototype.getHost = function(){
  var data = this.data.slice();
  return data.shift();
}

Location.prototype.getPath = function(){
  var data = this.data.slice();
  return data.join('\/');
}

Location.prototype.baseHost = function(){
  var host = this.getHost();
  if (!host) return;

  var m = String(host).match(/\b[a-z0-9-]+\.[a-z0-9-]+$/);
  if (m && m.length) return m[0];
}

Location.baseHost = function(location){
  var instance = new Location(location);
  return instance.baseHost(location);
}

module.exports = Location;