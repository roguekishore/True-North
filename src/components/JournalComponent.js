import Journal from '../components/Journal';
import DailyMomentsTracker from './DailyMomentsTracker';

function JournalComponent({ userId }){
    return(
        <div className='journal-component-container'>
            <Journal userId={userId}></Journal>
            
            <DailyMomentsTracker userId={userId}></DailyMomentsTracker>
        </div>
    )
}

export default JournalComponent;