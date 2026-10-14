let playing=null;
export async function speakGerman(wordId,{AudioClass=globalThis.Audio}={}){
 return playGermanAudio('/api/audio/'+encodeURIComponent(wordId),{AudioClass});
}
export async function playGermanAudio(url,{AudioClass=globalThis.Audio}={}){
 if(!AudioClass)throw Error('Audio playback is unavailable in this browser.');
 playing?.pause();
 const audio=new AudioClass(url);
 playing=audio;
 try{await audio.play();}catch{throw Error('German audio could not play. Check that the Piper voice service is running.');}
}
