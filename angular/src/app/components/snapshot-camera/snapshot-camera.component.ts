import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SnapshotApiService } from 'src/app/services/snapshot/snapshot-api.service';
import { SummaryEmotion } from 'src/app/models/shared/summary-emotion.model';
import { Snapshot } from 'src/app/models/snapshot/snapshot.model';
import { FormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-snapshot-camera',
  templateUrl: './snapshot-camera.component.html',
  styleUrls: ['./snapshot-camera.component.scss']
})
export class SnapshotCameraComponent implements OnInit, AfterViewInit, OnDestroy {

  // get reference to html elements
  @ViewChild(MatSort) sort: MatSort | undefined;
  @ViewChild('viewfinder') viewfinderRef: ElementRef<HTMLVideoElement> | undefined;
  video: HTMLVideoElement | undefined;

  // session id data
  @Input() sessionId = '';

  // event outputs
  @Output() newSnapshot = new EventEmitter<Snapshot>();
  @Output() startedChanges = new EventEmitter<boolean>();

  // viewfinder dimensions
  width = 320;
  height = 0;

  // suggestion text
  suggestion = '';

  // interval form control
  intervalControl = new FormControl(5, [ Validators.min(1) ]);
  matcher = new ErrorStateMatcher();

  // timeout reference
  timeout: NodeJS.Timeout | undefined;

  // table options
  displayedColumns = ['emotion', 'value'];
  summaryEmotion: SummaryEmotion[] = [];
  summaryDataSource = new MatTableDataSource(this.summaryEmotion);

  // states
  creating = false;

  // subscriptions to unsubcribe
  private subscriptions: Subscription[] = [];

  constructor(
    private snapshotApiService: SnapshotApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // update viewfinder dimensions
    this.setViewFinderDimensions();
  }

  ngAfterViewInit(): void {
    // get viewfinder reference and start it
    this.video = this.viewfinderRef?.nativeElement;
    this.startViewfinder();
  }

  @HostListener('window:resize')
  setViewFinderDimensions(): void {
    // get viewfinder container width
    const width = document.getElementsByClassName('viewfinder-container')[0].clientWidth; 
    // set viewfinder width
    if (width > 750) {
      this.width = 750;
    } else if (!isNaN(width)) {
      this.width = width;
    }
    // set viewfinder height
    if (this.video) {
      const height = this.video.videoHeight / (this.video.videoWidth / this.width);
      if (!isNaN(height)) {
        this.height = height;
      }
    }
  }

  startViewfinder(): void {
    // request video permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (this.video) {
          // set viewfinder source to stream video
          this.video.srcObject = stream;
          this.video.play();
        }
      });
    // update viewfinder dimensions
    this.video?.addEventListener('canplay', () => {
      this.setViewFinderDimensions();
    }, false);
  }

  stopViewfinder(): void {
    // stop streaming video in viewfinder
    if (this.video) {
      const stream = <MediaStream>this.video.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
      this.video.srcObject = null;
    }
  }

  start(): void {
    // check if interval field is valid
    if (this.intervalControl.valid) {
      // create first snapshot
      this.createSnapshot();
      // start interval to create more snapshots
      this.timeout = setInterval(() => {
        this.createSnapshot();
      }, this.intervalControl.value * 60000);
      // disable interval field
      this.intervalControl.disable();
      // emit started event
      this.startedChanges.emit(true);
    }
  }

  stop(): void {
    // stop interval
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    // enable interval field
    this.intervalControl.enable();
    // emit ended event
    this.startedChanges.emit(false);
  }

  createSnapshot(): void {
    if (this.video) {
      // update state
      this.creating = true;
      // create canvas with video dimensions and source
      const canvas = document.createElement('canvas');
      const width  = this.video.videoWidth;
      const height = this.video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(this.video, 0, 0, width, height);
      const data = canvas.toDataURL('image/jpeg').split('base64,')[1];
      // add to subscriptions
      this.subscriptions.push(
        // create a new snapshot
        this.snapshotApiService.createSnapshot(this.sessionId, { imageBase64: data })
        .subscribe({
          next: (response) => {
            if (Snapshot.isSnapshot(response)) {
              // emit new snapshot event
              this.newSnapshot.emit(response);
              // calculate summary emotion for table
              this.summaryEmotion = [];
              this.summaryEmotion.push({ emotion: 'Anger', value: response.perceivedEmotion.Anger });
              this.summaryEmotion.push({ emotion: 'Contempt', value: response.perceivedEmotion.Contempt });
              this.summaryEmotion.push({ emotion: 'Disgust', value: response.perceivedEmotion.Disgust });
              this.summaryEmotion.push({ emotion: 'Fear', value: response.perceivedEmotion.Fear });
              this.summaryEmotion.push({ emotion: 'Happiness', value: response.perceivedEmotion.Happiness });
              this.summaryEmotion.push({ emotion: 'Neutral', value: response.perceivedEmotion.Neutral });
              this.summaryEmotion.push({ emotion: 'Sadness', value: response.perceivedEmotion.Sadness });
              this.summaryEmotion.push({ emotion: 'Surprise', value: response.perceivedEmotion.Surprise });
              // update table data
              this.summaryDataSource = new MatTableDataSource(this.summaryEmotion);
              if (this.sort) {
                this.summaryDataSource.sort = this.sort;
              }
              // generate suggestions
              this.generateSuggestions();
            } else {
              this.snackBar.open(response, 'OK', { duration: 3000 });
            }
            // update state
            this.creating = false;
          },
          error: (error: Error) => {
            // show error
            this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
            // update state
            this.creating = false;
          }
        })
      );
    }
  }

  private generateSuggestions(): void {
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

  ngOnDestroy(): void {
    // stop recording
    this.stop();
    // stop viewfinder
    this.stopViewfinder();
    // unsubscribe from all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
