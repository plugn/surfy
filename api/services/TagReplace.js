function $R(s){
  return new RegExp(s, 'g');
}

$R.list = function(t){
  if ('object' == typeof t && 'length' in t) return t.join('|');
  return String(t);
}

$R.anyTag = function(s){ 
  return s.replace($R('<[^>]*?>'),'')
}
$R.exceptOpenTag = function(s,tag){
  return s.replace($R('<(?!'+tag+')[^>]*?>'),'')
}
$R.exceptTailTag = function(s,tag){
  return s.replace($R('<\/(?!'+tag+')[^>]*?>'),'')
}
$R.singleTags = function(s, tags){
  return s.replace($R('<('+$R.list(tags)+')[^>]*?>'),'')
}
$R.pairedTags = function(s, tags){
  return s.replace($R('<('+$R.list(tags)+'[^>]*?>.*?<\/\1>'),'')
}
$R.attrs = function(s, attrs){
  return s.replace($R('('+$R.list(attrs)+')\s?=\s?["\']?((?:.(?!["\']?\s+(?:\S+)=|[>"\']))+.)["\']?'), '')
}


module.exports = $R;