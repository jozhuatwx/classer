import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LegendPosition } from '@swimlane/ngx-charts';

import { LineChart } from 'src/app/models/shared/line-chart.model';
import { SummaryEmotion } from 'src/app/models/shared/summary-emotion.model';
import { Emotion } from 'src/app/models/snapshot/emotion.model';
import { Snapshot } from 'src/app/models/snapshot/snapshot.model';

@Component({
  selector: 'app-snapshot-card',
  templateUrl: './snapshot-card.component.html',
  styleUrls: ['./snapshot-card.component.scss']
})
export class SnapshotCardComponent implements OnChanges, OnInit {

  // get reference to html element
  @ViewChild(MatSort) sort: MatSort | undefined;

  // sessions data
  @Input() snapshots: Snapshot[] = [];

  // chart options
  chartDataSource: LineChart[] = [];
  legend = true;
  legendPosition = LegendPosition.Below;
  colourScheme = {
    domain: ['#fa8072', '#fdb9c8', '#29ab87', '#af69ee', '#c7ea46', '#878787', '#00b0fe', '#ffe12b']
  };

  // suggestion text
  suggestion = '';

  // table options
  displayedColumns = ['emotion', 'value'];
  summaryEmotion: SummaryEmotion[] = [];
  summaryDataSource = new MatTableDataSource<SummaryEmotion>();

  ngOnChanges(changes: SimpleChanges): void {
    // reload datasource when sessions data changed
    if (changes.snapshots && changes.snapshots.currentValue) {
      this.generateDataSource();
    }
  }

  ngOnInit(): void {
    // set legend position
    this.resized();
  }

  @HostListener('window:resize')
  resized(): void {
    // set legend position
    if (window.innerWidth < 1200) {
      this.legendPosition = LegendPosition.Below;
    } else {
      this.legendPosition = LegendPosition.Right;
    }
  }

  private generateDataSource(): void {
    // get total number of snapshots
    const length = this.snapshots.length;
    if (length > 0) {
      // reset summary emotion for table
      this.summaryEmotion = [];
      this.chartDataSource = [
        { name: 'Anger', series: [] },
        { name: 'Contempt', series: [] },
        { name: 'Disgust', series: [] },
        { name: 'Fear', series: [] },
        { name: 'Happiness', series: [] },
        { name: 'Neutral', series: [] },
        { name: 'Sadness', series: [] },
        { name: 'Surprise', series: [] },
      ];
      // create temporary emotion object
      let emotion: Emotion = { Anger: 0, Contempt: 0, Disgust: 0, Fear: 0, Happiness: 0, Neutral: 0, Sadness: 0, Surprise: 0 };
      for (const snapshot of this.snapshots) {
        // calculate sum summary emotion
        emotion.Anger += snapshot.perceivedEmotion.Anger;
        emotion.Contempt += snapshot.perceivedEmotion.Contempt;
        emotion.Disgust += snapshot.perceivedEmotion.Disgust;
        emotion.Fear += snapshot.perceivedEmotion.Fear;
        emotion.Happiness += snapshot.perceivedEmotion.Happiness;
        emotion.Neutral += snapshot.perceivedEmotion.Neutral;
        emotion.Sadness += snapshot.perceivedEmotion.Sadness;
        emotion.Surprise += snapshot.perceivedEmotion.Surprise;
        // add emotion to chart data source
        this.chartDataSource[0].series.push({ value: snapshot.perceivedEmotion.Anger, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[1].series.push({ value: snapshot.perceivedEmotion.Contempt, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[2].series.push({ value: snapshot.perceivedEmotion.Disgust, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[3].series.push({ value: snapshot.perceivedEmotion.Fear, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[4].series.push({ value: snapshot.perceivedEmotion.Happiness, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[5].series.push({ value: snapshot.perceivedEmotion.Neutral, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[6].series.push({ value: snapshot.perceivedEmotion.Sadness, name: new Date(snapshot.dateTime).toLocaleTimeString() });
        this.chartDataSource[7].series.push({ value: snapshot.perceivedEmotion.Surprise, name: new Date(snapshot.dateTime).toLocaleTimeString() });
      }
      // calculate average summary emotion for table
      this.summaryEmotion.push({ emotion: 'Anger', value: emotion.Anger / length });
      this.summaryEmotion.push({ emotion: 'Contempt', value: emotion.Contempt / length });
      this.summaryEmotion.push({ emotion: 'Disgust', value: emotion.Disgust / length });
      this.summaryEmotion.push({ emotion: 'Fear', value: emotion.Fear / length });
      this.summaryEmotion.push({ emotion: 'Happiness', value: emotion.Happiness / length });
      this.summaryEmotion.push({ emotion: 'Neutral', value: emotion.Neutral / length });
      this.summaryEmotion.push({ emotion: 'Sadness', value: emotion.Sadness / length });
      this.summaryEmotion.push({ emotion: 'Surprise', value: emotion.Surprise / length });
      // update table data
      this.summaryDataSource = new MatTableDataSource(this.summaryEmotion);
      if (this.sort) {
        this.summaryDataSource.sort = this.sort;
      }
      // generate suggestions
      this.generateSuggestions();
    }
  }

  private generateSuggestions() {
    // clear suggestion
    this.suggestion = '';
    // find highest emotional state
    const highest = Math.max.apply(Math, this.summaryEmotion.map((emotion) => emotion.value));
    for (const emotion of this.summaryEmotion) {
      if (emotion.value == highest) {
        // add suggestion
        switch (emotion.emotion) {
          case 'Anger':
            this.suggestion += 'Your students seems to be angry, consider asking if anything is bothering your students. ';
            break;

          case 'Surprise':
            this.suggestion += 'Your students are surprised, consider giving them some time to process the information. ';
            break;
          
          case 'Happiness':
            this.suggestion += 'You are doing great! Your students are happy! Keep it up! ';
            break;

          default:
            this.suggestion += 'Consider asking lightening up the class with a joke or conducting a fun class activity. ';
            break;
        }
      }
    }
  }
}
