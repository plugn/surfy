/*
tag with attrs parse
/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g.exec('<a href=ee style=" > < ">dd</a> <b />')

track a quote
/(["']+)([^\1]+)(\1)/g.exec(' <   \'"ededewew    > \' "   >   ')
*/

function $TR(s){
  return new RegExp(s, 'g');
}

$TR.list = function(t){
  if ('object' == typeof t && 'length' in t) return t.join('|');
  return String(t);
}

$TR.anyTag = function(s){ 
  return s.replace($TR('<[^>]*?>'),'')
}
$TR.exceptOpenTag = function(s,tag){
  return s.replace($TR('<(?!'+tag+')[^>]*?>'),'')
}
$TR.exceptTailTag = function(s,tag){
  return s.replace($TR('<\/(?!'+tag+')[^>]*?>'),'')
}
$TR.exceptTag = function(s,tag){
  return s.replace($TR('<\/(?!'+tag+')[^>]*?>|<(?!'+tag+')[^>]*?>'),'')
}
$TR.singleTags = function(s, tags){
  return s.replace($TR('<('+$TR.list(tags)+')[^>]*?>'),'')
}
$TR.pairedTags = function(s, tags){
  return s.replace($TR('<('+$TR.list(tags)+'[^>]*?>.*?<\/\1>'),'')
}
$TR.attrs = function(s, attrs){
  return s.replace($TR('('+$TR.list(attrs)+')\s?=\s?["\']?((?:.(?!["\']?\s+(?:\S+)=|[>"\']))+.)["\']?'), '')
}


module.exports = $TR;